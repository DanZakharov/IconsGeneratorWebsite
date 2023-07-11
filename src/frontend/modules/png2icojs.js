const maxSize = 256; // 1 << 8
const rileHeaderSize = 6;
const imageHeaderSize = 16;
const icoDefaultMime = "image/x-icon";

export class PngIcoConverter {
    async convertToBlobAsync(input, mime = icoDefaultMime) {
        const arr = await this.convertAsync(input);
        return new Blob([arr], {
            type: mime,
        });
    }
    async convertAsync(input) {
        // File Format: https://en.wikipedia.org/wiki/ICO_(file_format)
        // File Header + Image Header + Image Content
        const headersLen = rileHeaderSize + imageHeaderSize;
        const totalLen = headersLen + this.pngLen(input.png);
        const arr = new Uint8Array(totalLen);
        
        // File Header
        arr.set([0, 0, 1, 0, ...this.to2Bytes(1)], 0);

        // Image Headers & Data
        const blob = this.toBlob(input.png);
        const img = await this.loadImageAsync(blob);
        const w = img.naturalWidth, h = img.naturalHeight;

        if (!input.ignoreSize && (w > maxSize || h > maxSize)) { throw new Error("INVALID_SIZE"); }

        // Header
        arr.set([
            w > maxSize ? 0 : w,
            h > maxSize ? 0 : h,
            0,
            0,
            0, 0,
            ...(input.bpp ? this.to2Bytes(input.bpp) : [0, 0]),
            ...this.to4Bytes(blob.size),
            ...this.to4Bytes(headersLen),
        ], rileHeaderSize);
 
        // Image
        const buffer = input.png instanceof ArrayBuffer ? input.png : await input.png.arrayBuffer();
        arr.set(new Uint8Array(buffer), headersLen);
        return arr;
    }
    loadImageAsync(png) {
        return new Promise((r, rej) => {
            const img = new Image();
            img.onload = () => r(img);
            img.onerror = () => rej('INVALID_IMAGE');
            img.src = URL.createObjectURL(png);
        });
    }
    toBlob(input, type = "image/png") {
        return input instanceof Blob ? input : new Blob([input], {
            type,
        });
    }
    to2Bytes(n) {
        return [n & 255, (n >> 8) & 255];
    }
    to4Bytes(n) {
        return [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
    }
    pngLen(png) {
        if (png instanceof Blob) return png.size;
        return png.byteLength;
    }
}
//# sourceMappingURL=png2icojs.js.map
