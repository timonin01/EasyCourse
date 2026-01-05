package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.math.request.StepikBlockMathRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class MathStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseMathRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "math");
                }
            }
            String jsonWithName = objectMapper.writeValueAsString(node);
            StepikBlockMathRequest request = objectMapper.readValue(jsonWithName, StepikBlockMathRequest.class);
            if (!validateMathRequest(request)) {
                throw new IllegalArgumentException("Invalid math request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse math request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid math request format", e);
        }
    }

    private boolean validateMathRequest(StepikBlockMathRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Math request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("Math request validation failed: missing source");
            return false;
        }

        if (request.getSource().getAnswer() == null || request.getSource().getAnswer().trim().isEmpty()) {
            log.warn("Math request validation failed: missing answer");
            return false;
        }

        return true;
    }
}

