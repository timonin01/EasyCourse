package org.core.service.ai;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.exception.exceptions.PromptLengthExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiPromptLimitService {

    @Value("${ai.prompt.max-chars.chat}")
    private int chatMaxChars;

    @Value("${ai.prompt.max-chars.generate}")
    private int generateMaxChars;

    @Value("${ai.prompt.max-chars.batch}")
    private int batchMaxChars;

    public void validateChatPrompt(String userInput) {
        validateLength(userInput, chatMaxChars, "чат");
    }

    public void validateGeneratePrompt(String userInput) {
        validateLength(userInput, generateMaxChars, "генерация шага");
    }

    public void validateBatchPrompt(String userInput) {
        validateLength(userInput, batchMaxChars, "batch-генерация");
    }

    public void validateBatchPlan(BatchStepDTO batchStepDTO) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null) {
            return;
        }
        for (CountStepDTO step : batchStepDTO.getSteps()) {
            if (step.getSpecificInput() != null && !step.getSpecificInput().isBlank()) {
                validateGeneratePrompt(step.getSpecificInput());
            }
        }
    }

    private void validateLength(String userInput, int maxChars, String contextLabel) {
        if (userInput == null) {
            return;
        }
        int length = userInput.length();
        if (length > maxChars) {
            String message = String.format(
                    "Промпт для %s слишком длинный: %d символов (максимум %d)",
                    contextLabel,
                    length,
                    maxChars
            );
            log.warn(message);
            throw new PromptLengthExceededException(message);
        }
    }
}
