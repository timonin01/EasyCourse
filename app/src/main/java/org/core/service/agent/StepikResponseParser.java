package org.core.service.agent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.stepikStepParcer.ChoiceStepParser;
import org.core.service.agent.stepikStepParcer.FreeAnswerStepParser;
import org.core.service.agent.stepikStepParcer.TextStepParser;
import org.core.service.agent.stepikStepParcer.SortingStepParser;
import org.core.service.agent.stepikStepParcer.MatchingStepParser;
import org.core.service.agent.stepikStepParcer.TableStepParser;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikResponseParser {

    private static final Pattern JSON_PATTERN = Pattern.compile("```json\\s*(.*?)\\s*```", Pattern.DOTALL);

    private final ChoiceStepParser choiceStepParser;
    private final TextStepParser textStepParser;
    private final FreeAnswerStepParser freeAnswerStepParser;
    private final SortingStepParser sortingStepParser;
    private final MatchingStepParser matchingStepParser;
    private final TableStepParser tableStepParser;

    public StepikBlockRequest parseResponse(String aiResponse, String stepType) {
        try {
            String cleanJson = extractJsonFromResponse(aiResponse);

            return switch (stepType.toLowerCase()) {
                case "choice" -> choiceStepParser.parseChoiceRequest(cleanJson);
                case "text" -> textStepParser.parseTextRequest(cleanJson);
                case "free-answer" -> freeAnswerStepParser.parseFreeAnswerRequest(cleanJson);
                case "sorting" -> sortingStepParser.parseSortingRequest(cleanJson);
                case "matching" -> matchingStepParser.parseMatchingRequest(cleanJson);
                case "table" -> tableStepParser.parseTableRequest(cleanJson);
                default -> throw new IllegalArgumentException("Unsupported step type: " + stepType);
            };
            
        } catch (Exception e) {
            log.error("Failed to parse AI response for step type {}: {}", stepType, e.getMessage());
            throw new RuntimeException("Invalid AI response format: " + e.getMessage());
        }
    }
    
    private String extractJsonFromResponse(String response) {
        var matcher = JSON_PATTERN.matcher(response);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        String trimmed = response.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }
        
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        
        throw new IllegalArgumentException("No valid JSON found in response");
    }

}
