package com.iconGeneratorServer.httpserver.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.iconGeneratorServer.httpserver.util.Json;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;

public class ConfigurationManager {

    private static ConfigurationManager myConfigurationManager;
    private static Configuration myCurrentConfiguration;
    private ConfigurationManager() {
//        this.myCurrentConfiguration = myCurrentConfiguration;
    }

    public static ConfigurationManager getInstance() {
        if (myConfigurationManager == null) myConfigurationManager = new ConfigurationManager();
        return myConfigurationManager;
    }


    /**
     *  to load the config file by the path provided
     */
    public void loadConfigurationFile(String filePath) {
        FileReader fileReader;

        try {
            fileReader = new FileReader(filePath);
        } catch (FileNotFoundException e) {
            throw new HttpConfigurationException(e);
        }

        StringBuffer stringBuffer = new StringBuffer();

        int i;
        try {
            while ((i = fileReader.read()) != -1) {
                stringBuffer.append((char)i);
            }
        } catch (IOException e) {
            throw new HttpConfigurationException(e);
        }

        JsonNode config;

        try {
            config = Json.parse(stringBuffer.toString());
        } catch (IOException e) {
            throw new HttpConfigurationException("Error parsing the Configuration File", e);
        }

        try {
            myCurrentConfiguration = Json.fromJson(config, Configuration.class);
        } catch (JsonProcessingException e) {
            throw new HttpConfigurationException("Error parsing the Configuration File (internal)", e);
        }
    }

    /**
     * return the current loaded configuration
     */
    public Configuration getCurrentConfiguration() {
        if (myCurrentConfiguration == null) {
            throw new HttpConfigurationException("No Current Configuration set!");
        }
        return myCurrentConfiguration;
    }

}
