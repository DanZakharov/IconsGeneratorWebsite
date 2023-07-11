package com.iconGeneratorServer.httpserver.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

public class HttpConnectionWorkerThread extends Thread {

    private static final Map<String, String> MIME_TYPES = new HashMap<>();

    static {
        MIME_TYPES.put(".html", "text/html");
        MIME_TYPES.put(".css", "text/css");
        MIME_TYPES.put(".js", "application/javascript");
    }

    private final static Logger LOGGER = LoggerFactory.getLogger(HttpConnectionWorkerThread.class);
    private Socket socket;

    public HttpConnectionWorkerThread(Socket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {

        super.run();

        InputStream inputStream = null;
        OutputStream outputStream = null;

        try {
            LOGGER.info("Started processing!");
            inputStream = socket.getInputStream();
            outputStream = socket.getOutputStream();

            String request = new String(inputStream.readAllBytes());
            String[] requestLines = request.split("\r\n");
            String[] requestLine = requestLines[0].split(" ");
            String route = requestLine[1];
            LOGGER.info("Registering route...");
            if (route.equals("/")) {
                LOGGER.info("Processing main route");
                String html = readFileAsString("src/frontend/index.html");
                final String CRLF = "\r\n";
                String response =
                        "HTTP/1.1 200 OK" + CRLF + // Status Line : HTTP_VERSION RESPONSE_CODE RESPONSE_MESSAGE
                                "Content-Length: " + html.getBytes().length + CRLF + // HEADER
                                CRLF + html + CRLF + CRLF;

                outputStream.write(response.getBytes());
            } else if (route.endsWith(".css") || route.endsWith(".js") || route.endsWith(".html")) {
                String fileExtension = route.substring(route.lastIndexOf('.'));
                String contentType = MIME_TYPES.getOrDefault(fileExtension, "text/plain");

                String fileContent = readFileAsString("src/frontend" + route);
                LOGGER.info("Processing " + fileContent + " route");

                final String CRLF = "\r\n";
                String response =
                        "HTTP/1.1 200 OK" + CRLF +
                                "Content-Length: " + fileContent.getBytes().length + CRLF +
                                "Content-Type: " + contentType + CRLF +
                                CRLF + fileContent + CRLF + CRLF;

                outputStream.write(response.getBytes());
            }
            LOGGER.info("Connection processing finished!");
        } catch (IOException e) {
            LOGGER.error("Problem with communication", e);
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    LOGGER.error("Error while closing socket. Ignoring.", e);
                }
            }
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (IOException e) {
                    LOGGER.error("Error while closing inputStream. Ignoring.", e);
                }
            }
            if (outputStream != null) {
                try {
                    outputStream.close();
                } catch (IOException e) {
                    LOGGER.error("Error while closing outputStream. Ignoring.", e);
                }
            }
        }
    }

    private String readFileAsString(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        byte[] bytes = Files.readAllBytes(path);
        return new String(bytes);
    }

}
