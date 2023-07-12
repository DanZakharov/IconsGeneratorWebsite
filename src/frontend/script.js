import { PngIcoConverter } from "/modules/png2icojs.js";

let openedSettings = false;

let userSettings = {
    'amount-of-images': 4,
    'rem-back': false,
    'download-file-format': 'ico',
    'generated-images': []
}

let settingsHTML;

fetch('settings.html')
    .then(response => response.text())
    .then(html => {
        settingsHTML = new DOMParser().parseFromString(html, 'text/html');
    })

const settingTextSelector = 'div.setting-box input[type="text"]';
const settingToggleSelector = 'button.toggle-switch';
const settingDropdownSelector = 'select.dropdown-options';
const promptInputSelector = '#prompt-input';
const settingsDivSelector = 'div#settings-js';
const generationShowResultsSelector = 'div#gen-results > div#show-images-js';
const generationResultsInfoSelector = 'div#gen-results > p#gen-results-info-js';
const settingsIconSelector = 'img#settings-icon-js';
const downloadButtonSelector = 'button#download-button';

function handleSettingsIconClick() {
    openedSettings ? hideSettings() : showSettings()
    openedSettings = !openedSettings
}

function showSettings() {
    const settingsDiv = document.querySelector(settingsDivSelector);
    settingsHTML.querySelectorAll(settingTextSelector).forEach(setting => {
        setting.placeholder = userSettings[setting.id];
    })
    settingsHTML.querySelectorAll(settingToggleSelector).forEach(setting => {
        if (userSettings[setting.id]) {
            setting.innerText = 'ON';
            setting.classList = 'toggle-switch on-state-js';
        } else {
            setting.innerText = 'OFF';
            setting.classList = 'toggle-switch off-state-js';
        }
    })
    settingsHTML.querySelectorAll(settingDropdownSelector).forEach(setting => {
        const firstOption = setting.options[0].innerText;
        console.log(userSettings)
        const neededOption = pickOption(setting, userSettings[setting.id]);
        setting.options[0].innerText = userSettings[setting.id];
        neededOption.innerText = firstOption;
        console.log(`Before for end:\n${setting.options[0].innerText}\n${setting.options[1].innerText}`)
    })
    
    console.log(`Before setting:\n${settingsHTML.querySelectorAll(settingDropdownSelector)}`)
    settingsDiv.innerHTML = settingsHTML.documentElement.innerHTML;
}

function pickOption(selectObj, valueToPick) {
    for (let i = 0; i < selectObj.options.length; i++) {
        if (selectObj.options[i].innerText === valueToPick) {
            console.log(`In pickOption:\n${selectObj.options[0].innerText}\n${selectObj.options[1].innerText}`)
            return selectObj.options[i];
        }
    }
}

function hideSettings() {
    const settingsDiv = document.querySelector(settingsDivSelector);
    settingsDiv.querySelectorAll(settingTextSelector).forEach(setting => {
        if (setting.value) userSettings[setting.id] = setting.value;
    });
    settingsDiv.querySelectorAll(settingToggleSelector).forEach(setting => {
        setting.innerHTML === 'ON' ? userSettings[setting.id] = true : userSettings[setting.id] = false;
    })
    settingsDiv.querySelectorAll(settingDropdownSelector).forEach(setting => {
        console.log(setting.options[setting.selectedIndex].innerText)
        userSettings[setting.id] = setting.options[setting.selectedIndex].innerText;
    })
    settingsDiv.innerHTML = null;
}

async function createImages(
    prompt, amount, toAppend, logsElement, remBackground, ifEnhancePrompt = true
) {
    let promptApproved = prompt
    logsElement.innerText = 'Generating images...';
    if (ifEnhancePrompt) {promptApproved = await enhancePrompt(prompt)}
    else {promptApproved = prompt}
    for (let i = 0; i < amount; i++) {
        const blob = await recursiveCreateImage(promptApproved, " ".repeat(i));
        const img = new Image();
        const rbBlob = await (remBackground ? (await removeBackground(blob)) : blob);
        userSettings['generated-images'].push({
            blob: rbBlob,
            prompt: prompt
        });
        img.src = URL.createObjectURL(rbBlob);
        toAppend.appendChild(img);
        logsElement.innerText = `Still generating... ${amount - (i + 1)} left.`;
    }
    console.log(userSettings['generated-images'][0].blob)
    logsElement.innerText = null;
}

async function removeBackground(imageBlob){
    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', imageBlob);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Api-Key': 'VJyGZuwKi74Cy8SJWSvje1oq',
        },
    })

    return await response.blob();
}

async function recursiveCreateImage(promptFirstP, promptSecondP = "") {
    const response = await fetch(
        'https://api-inference.huggingface.co/models/prompthero/openjourney',
        {
            headers: { Authorization: 'Bearer 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' },
            method: 'POST',
            body: JSON.stringify({'inputs': promptFirstP + promptSecondP}),
        }
    );
    const blob = await response.blob();
    console.log(response.status) 
    if (response.status === 503 || blob.size === 4723) {
        console.log('calling recursively...')
        return await recursiveCreateImage(promptFirstP + ".", promptSecondP);
    }
    return blob;
}


async function enhancePrompt(prompt) {
    return (await
        (await fetch(
        `https://krj69mx8dxc5qezfcztk.heirogerdawqpd7.repl.co/template/L6xtCX6naE8MG4kmeY/generation_image_icon_s/${prompt}`,
        {
            method: 'POST'
        }
    )).json()
    )['response'];
}


function submitPrompt(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const userInput = event.target.value;
        const generationShowResultsElement = document.querySelector(generationShowResultsSelector);
        const generationResultsInfoElement = document.querySelector(generationResultsInfoSelector);
        hideSettings();
        openedSettings = false;
        let amountOfImages;
        userSettings['amount-of-images'] > 10 ? amountOfImages = 10 : amountOfImages = userSettings['amount-of-images']
        createImages(
            userInput, amountOfImages, generationShowResultsElement,
            generationResultsInfoElement, userSettings['rem-back']
        );
    }
}

async function processAllImages() {
    const converter = new PngIcoConverter();
    if (userSettings['download-file-format'] === 'ico') {
        for (const image of userSettings['generated-images']) {
            downloadImage(
                await converter.convertToBlobAsync({
                    png: await resizeSquareImage(image.blob)
                }), 
                image.prompt.split(" ").slice(0, 3).join(" ")
            );
        }   
    } else if (userSettings['download-file-format'] === 'png') {
        for (const image of userSettings['generated-images']) {
            downloadImage(image.blob, image.prompt.split(" ").slice(0, 3).join(" ") + '.png');
        }
    }
}
  
async function resizeSquareImage(imageBlob, wantedSize = 256) {
    try {
        const imgBitmap = await createImageBitmap(imageBlob);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = wantedSize;
        canvas.height = wantedSize;

        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve) => {
            canvas.toBlob(resolve)
        })

    } catch (error) {
      throw new Error('Image resize failed: ' + error.message);
    }
}  
  

function downloadImage(imageBlob, fileName) {

    const url = URL.createObjectURL(imageBlob);
    const toDownload = document.createElement("a");
    toDownload.href = url;
    toDownload.download = fileName;

    toDownload.click();
}

const promptInputElement = document.querySelector(promptInputSelector);
const settingsIconElement = document.querySelector(settingsIconSelector);
const downloadButtonElement = document.querySelector(downloadButtonSelector);

settingsIconElement.addEventListener('click', handleSettingsIconClick);
promptInputElement.addEventListener('keydown', submitPrompt);
downloadButtonElement.addEventListener('click', processAllImages);

