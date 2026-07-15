package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.json.JsonReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.code.request.StepikBlockCodeRequest;
import org.core.dto.stepik.step.code.request.StepikCodeSourceRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class CodeStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseCodeRequest(String json) {
        try {
            JsonFactory jsonFactory = JsonFactory.builder()
                    .enable(JsonReadFeature.ALLOW_UNESCAPED_CONTROL_CHARS)
                    .build();
            ObjectMapper lenientMapper = new ObjectMapper(jsonFactory);
            lenientMapper.setConfig(objectMapper.getDeserializationConfig());
            lenientMapper.setConfig(objectMapper.getSerializationConfig());

            String repaired = escapeRawControlCharsInJsonStrings(json);
            JsonNode node = lenientMapper.readTree(repaired);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "code");
                }
            }
            String jsonWithName = lenientMapper.writeValueAsString(node);
            StepikBlockCodeRequest request = lenientMapper.readValue(jsonWithName, StepikBlockCodeRequest.class);
            fixCodeRequestIfNeeded(request);
            if (!validateCodeRequest(request)) {
                throw new IllegalArgumentException("Invalid code request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse code request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid code request format", e);
        }
    }

    private static String escapeRawControlCharsInJsonStrings(String json) {
        if (json == null || json.isEmpty()) {
            return json;
        }
        StringBuilder sb = new StringBuilder(json.length() + 32);
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (!inString) {
                if (c == '"') {
                    inString = true;
                }
                sb.append(c);
                continue;
            }
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (c == '\\') {
                sb.append(c);
                escaped = true;
                continue;
            }
            if (c == '"') {
                inString = false;
                sb.append(c);
                continue;
            }
            switch (c) {
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    private void fixCodeRequestIfNeeded(StepikBlockCodeRequest request) {
        if (request == null || request.getSourceRequest() == null) return;
        StepikCodeSourceRequest src = request.getSourceRequest();
        if (src.getTestCases() == null || src.getTestCases().isEmpty()) {
            src.setTestCases(List.of(List.of("", "")));
            log.warn("Code request: test_cases was null/empty, set placeholder [[\"\", \"\"]]. Author must edit.");
        }
    }

    private boolean validateCodeRequest(StepikBlockCodeRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Code request validation failed: empty text");
            return false;
        }
        if (request.getSourceRequest() == null) {
            log.warn("Code request validation failed: missing source");
            return false;
        }
        StepikCodeSourceRequest src = request.getSourceRequest();
        if (src.getTestCases() == null || src.getTestCases().isEmpty()) {
            log.warn("Code request validation failed: test_cases empty or null");
            return false;
        }
        for (List<String> pair : src.getTestCases()) {
            if (pair == null || pair.size() < 2) {
                log.warn("Code request validation failed: test_cases element must be [input, expected]");
                return false;
            }
        }
        return true;
    }
}
