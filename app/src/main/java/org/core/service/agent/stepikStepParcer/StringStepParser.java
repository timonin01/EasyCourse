package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StringStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseStringRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "string");
                }
            }
            String jsonWithName = objectMapper.writeValueAsString(node);
            StepikBlockStringRequest request = objectMapper.readValue(jsonWithName, StepikBlockStringRequest.class);
            if (!validateStringRequest(request)) {
                throw new IllegalArgumentException("Invalid string request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse string request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid string request format", e);
        }
    }

    private boolean validateStringRequest(StepikBlockStringRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("String request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("String request validation failed: missing source");
            return false;
        }

        if (request.getSource().getPattern() == null || request.getSource().getPattern().trim().isEmpty()) {
            log.warn("String request validation failed: missing pattern");
            return false;
        }

        return true;
    }
}

