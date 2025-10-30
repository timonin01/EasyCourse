package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class TextStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseTextRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "text");
            }
            StepikBlockTextRequest request = objectMapper.treeToValue(node, StepikBlockTextRequest.class);

            if (!validateTextRequest(request)) {
                throw new IllegalArgumentException("Invalid text request structure");
            }

            log.debug("Successfully parsed text request");
            return request;

        } catch (Exception e) {
            log.error("Failed to parse text request: {}", e.getMessage());
            throw new RuntimeException("Invalid text request format", e);
        }
    }

    private boolean validateTextRequest(StepikBlockTextRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Text request validation failed: empty text");
            return false;
        }
        return true;
    }

}
