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
import org.core.service.agent.stepikStepParcer.FillBlanksStepParser;
import org.core.service.agent.stepikStepParcer.MathStepParser;
import org.core.service.agent.stepikStepParcer.StringStepParser;
import org.core.service.agent.stepikStepParcer.RandomTasksStepParser;
import org.core.service.agent.stepikStepParcer.NumberStepParser;
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
    private final FillBlanksStepParser fillBlanksStepParser;
    private final MathStepParser mathStepParser;
    private final StringStepParser stringStepParser;
    private final RandomTasksStepParser randomTasksStepParser;
    private final NumberStepParser numberStepParser;

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
                case "fill-blanks" -> fillBlanksStepParser.parseFillBlanksRequest(cleanJson);
                case "math" -> mathStepParser.parseMathRequest(cleanJson);
                case "string" -> stringStepParser.parseStringRequest(cleanJson);
                case "random-tasks" -> randomTasksStepParser.parseRandomTasksRequest(cleanJson);
                case "number" -> numberStepParser.parseNumberRequest(cleanJson);
                default -> throw new IllegalArgumentException("Unsupported step type: " + stepType);
            };
            
        } catch (Exception e) {
            log.error("Failed to parse AI response for step type {}: {}", stepType, e.getMessage());
            throw new RuntimeException("Invalid AI response format: " + e.getMessage());
        }
    }
    
    private String extractJsonFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty response from AI");
        }
        
        var matcher = JSON_PATTERN.matcher(response);
        if (matcher.find()) {
            return cleanJsonString(matcher.group(1).trim());
        }
        
        String trimmed = response.trim();
        if (trimmed.length() < 10 || !trimmed.contains("\"text\"") && !trimmed.contains("\"source\"")) {
            log.warn("Response appears to be invalid JSON: {}", trimmed.length() > 100 ? trimmed.substring(0, 100) + "..." : trimmed);
            throw new IllegalArgumentException("Invalid JSON structure in AI response");
        }
        
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return cleanJsonString(trimmed);
        }
        
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            String extracted = trimmed.substring(start, end + 1);
            if (extracted.length() < 10 || (!extracted.contains("\"text\"") && !extracted.contains("\"source\""))) {
                log.warn("Extracted JSON appears to be invalid: {}", extracted.length() > 100 ? extracted.substring(0, 100) + "..." : extracted);
                throw new IllegalArgumentException("Invalid JSON structure in extracted response");
            }
            return cleanJsonString(extracted);
        }
        
        throw new IllegalArgumentException("No valid JSON found in response");
    }
    
    private String cleanJsonString(String json) {
        if (json == null || json.isEmpty()) {
            return json;
        }
        
        String cleaned = json.trim();
        if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
            cleaned = cleaned.replace("\\\"", "\"");
        }
        
        cleaned = cleaned.trim();
        return cleaned;
    }

}
