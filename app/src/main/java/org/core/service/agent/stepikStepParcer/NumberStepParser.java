package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikBlockNumberRequest;
import org.core.dto.stepik.step.enterWord.number.request.StepikNumberOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class NumberStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseNumberRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject() && !node.has("name")) {
                ((ObjectNode) node).put("name", "number");
            }
            StepikBlockNumberRequest request = objectMapper.treeToValue(node, StepikBlockNumberRequest.class);
            if (!validateNumberRequest(request)) {
                throw new IllegalArgumentException("Invalid number request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse number request: {}", e.getMessage());
            throw new RuntimeException("Invalid number request format", e);
        }
    }

    private boolean validateNumberRequest(StepikBlockNumberRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Number request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null || request.getSource().getOptions() == null) {
            log.warn("Number request validation failed: missing source or options");
            return false;
        }

        List<StepikNumberOptionRequest> options = request.getSource().getOptions();
        if (options.isEmpty()) {
            log.warn("Number request validation failed: options empty");
            return false;
        }

        boolean allOptionsHaveAnswer = options.stream()
                .allMatch(option -> option.getAnswer() != null && !option.getAnswer().trim().isEmpty());
        if (!allOptionsHaveAnswer) {
            log.warn("Number request validation failed: some options missing answer");
            return false;
        }

        return true;
    }
}

