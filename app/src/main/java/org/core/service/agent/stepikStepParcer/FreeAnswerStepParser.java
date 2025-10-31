package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.freeAnswer.request.StepikBlockFreeAnswerRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class FreeAnswerStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseFreeAnswerRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "free-answer");
            }
            StepikBlockFreeAnswerRequest request = objectMapper.treeToValue(node, StepikBlockFreeAnswerRequest.class);
            if (!validateFreeAnswerRequest(request)) {
                throw new IllegalArgumentException("Invalid free-answer request structure");
            }

            return request;
        } catch (Exception e) {
            log.error("Failed to parse free-answer request: {}", e.getMessage());
            throw new RuntimeException("Invalid free-answer request format", e);
        }
    }

    private boolean validateFreeAnswerRequest(StepikBlockFreeAnswerRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Free-answer request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("Free-answer request validation failed: missing source");
            return false;
        }

        if (request.getSource().getIs_attachments_enabled() == null &&
                request.getSource().getIs_html_enabled() == null &&
                request.getSource().getManual_scoring() == null) {
            log.warn("Free-answer request validation failed: source has no configuration fields");
            return false;
        }
        log.debug("Free-answer request validation passed");
        return true;
    }

}
