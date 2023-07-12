package com.iconGeneratorServer.httpserver.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;

import java.io.IOException;

public class Json {

    private static final ObjectMapper objectMapper = defaultObjectMapper();

    private static ObjectMapper defaultObjectMapper () {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return objectMapper;
    }

    public static JsonNode parse(String jsonSource) throws IOException {
        return objectMapper.readTree(jsonSource);
    }

    public static <A> A fromJson(JsonNode jsonNode, Class<A> cls) throws IllegalArgumentException, JsonProcessingException {
        return objectMapper.treeToValue(jsonNode, cls);
    }

    public static JsonNode toJson(Object object) {
        return objectMapper.valueToTree(object);
    }

    public static String stringify(JsonNode jsonNode) throws JsonProcessingException {
        return generateJson(jsonNode, false);
    }

    public static String stringifyPretty(JsonNode jsonNode) throws JsonProcessingException {
        return generateJson(jsonNode, true);
    }

    public static String generateJson(Object object, boolean pretty) throws JsonProcessingException {
        ObjectWriter objectWriter = objectMapper.writer();
        if (pretty) {
            objectWriter = objectWriter.with(SerializationFeature.INDENT_OUTPUT);
        }
        return objectWriter.writeValueAsString(object);
    }


}
