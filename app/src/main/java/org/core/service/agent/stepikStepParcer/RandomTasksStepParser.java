package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.randomTasks.request.StepikBlockRandomTasksRequest;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class RandomTasksStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseRandomTasksRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "random-tasks");
            }
            StepikBlockRandomTasksRequest request = objectMapper.treeToValue(node, StepikBlockRandomTasksRequest.class);
            if (!validateRandomTasksRequest(request)) {
                throw new IllegalArgumentException("Invalid random-tasks request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse random-tasks request: {}", e.getMessage());
            throw new RuntimeException("Invalid random-tasks request format", e);
        }
    }

    private boolean validateRandomTasksRequest(StepikBlockRandomTasksRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Random-tasks request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("Random-tasks request validation failed: missing source");
            return false;
        }

        if (request.getSource().getTask() == null || request.getSource().getTask().trim().isEmpty()) {
            log.warn("Random-tasks request validation failed: missing task");
            return false;
        }

        if (request.getSource().getSolve() == null || request.getSource().getSolve().trim().isEmpty()) {
            log.warn("Random-tasks request validation failed: missing solve");
            return false;
        }

        return true;
    }
}

