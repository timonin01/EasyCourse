package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.test.choise.request.StepikBlockChoiceRequest;
import org.core.dto.stepik.step.test.choise.request.StepikChoiceOptionRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class ChoiceStepParser {

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseChoiceRequest(String json) {
        try {
            StepikBlockChoiceRequest request = objectMapper.readValue(json, StepikBlockChoiceRequest.class);
            if (!validateChoiceRequest(request)) {
                throw new IllegalArgumentException("Invalid choice request structure");
            }

            return request;
        } catch (Exception e) {
            log.error("Failed to parse choice request: {}", e.getMessage());
            throw new RuntimeException("Invalid choice request format", e);
        }
    }

    private boolean validateChoiceRequest(StepikBlockChoiceRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("Choice request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null || request.getSource().getOptions() == null) {
            log.warn("Choice request validation failed: missing source or options");
            return false;
        }

        List<StepikChoiceOptionRequest> options = request.getSource().getOptions();
        if (options.size() < 2) {
            log.warn("Choice request validation failed: expected at least 2 options, got {}", options.size());
            return false;
        }

        boolean allOptionsHaveText = options.stream()
                .allMatch(option -> option.getText() != null && !option.getText().trim().isEmpty());
        if (!allOptionsHaveText) {
            log.warn("Choice request validation failed: some options are missing text");
            return false;
        }

        long correctCount = options.stream()
                .filter(option -> option.getIsCorrect() != null && option.getIsCorrect())
                .count();
        if (correctCount == 0) {
            log.warn("Choice request validation failed: no correct options found");
            return false;
        }
        return true;
    }

}
