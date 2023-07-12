package com.iconGeneratorServer.httpserver;

import com.iconGeneratorServer.httpserver.config.Configuration;
import com.iconGeneratorServer.httpserver.config.ConfigurationManager;
import com.iconGeneratorServer.httpserver.core.ServerListenerThread;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

public class HttpServer {

    private final static Logger LOGGER = LoggerFactory.getLogger(HttpServer.class);

    public static void main(String[] args) {

        LOGGER.info("Started. Trying to run the server...");

        ConfigurationManager.getInstance().loadConfigurationFile("src/backend/resources/http.json");
        Configuration config = ConfigurationManager.getInstance().getCurrentConfiguration();

        LOGGER.info("Running on Port: " + config.getPort());
        LOGGER.info("Running on webroot: " + config.getWebroot());

        try {
            ServerListenerThread serverListenerThread = new ServerListenerThread(config.getPort(), config.getWebroot());
            serverListenerThread.start();
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

}
