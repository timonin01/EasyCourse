package org.core.dto.agent.batchAnalyzer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.StepikResponseParser;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class BatchStepParser {

    private final ObjectMapper objectMapper;
    private final StepikResponseParser responseParser;

    public List<StepikBlockRequest> parseAiResponseToRequestsList(String aiResponse, String stepType, int count) {
        try {
            log.info("Raw AI response (length: {}): {}", aiResponse != null ? aiResponse.length() : 0, aiResponse);
            
            if (aiResponse == null || aiResponse.trim().length() < 20) {
                throw new IllegalArgumentException("Response too short or empty, likely truncated");
            }
            String trimmed = aiResponse.trim();
            int openBraces = (int) trimmed.chars().filter(c -> c == '{').count();
            int closeBraces = (int) trimmed.chars().filter(c -> c == '}').count();
            int openBrackets = (int) trimmed.chars().filter(c -> c == '[').count();
            int closeBrackets = (int) trimmed.chars().filter(c -> c == ']').count();
            
            if (openBraces > closeBraces || openBrackets > closeBrackets) {
                log.warn("Response appears to be truncated: openBraces={}, closeBraces={}, openBrackets={}, closeBrackets={}",
                        openBraces, closeBraces, openBrackets, closeBrackets);
                
                long nonEscapeChars = trimmed.chars().filter(c -> c != '\u007f' && !Character.isWhitespace(c) && c != '\\').count();
                if (nonEscapeChars < 50) {
                    log.warn("Response contains mostly escape characters, cannot extract valid JSON");
                    throw new IllegalArgumentException("Response appears to be truncated and contains invalid characters");
                }
                
                log.info("Attempting to extract partial objects from truncated response");
                try {
                    String partialArray = extractPartialJsonArray(trimmed);
                    if (partialArray != null && isValidJsonArray(partialArray)) {
                        log.info("Successfully extracted partial JSON array from truncated response");
                        trimmed = partialArray;
                    } else {
                        throw new IllegalArgumentException("Response appears to be truncated (unclosed brackets/braces)");
                    }
                } catch (StackOverflowError | OutOfMemoryError e) {
                    log.error("Stack overflow or out of memory while extracting partial objects - response too complex");
                    throw new IllegalArgumentException("Response appears to be truncated and too complex to parse");
                } catch (Exception e) {
                    log.error("Failed to extract partial objects: {}", e.getMessage());
                    throw new IllegalArgumentException("Response appears to be truncated (unclosed brackets/braces)");
                }
            }
            
            String jsonArray = extractJsonArray(aiResponse);

            List<Map<String, Object>> jsonArrayParsed = objectMapper.readValue(
                    jsonArray,
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            log.info("Parsed {} JSON objects from batch response", jsonArrayParsed.size());

            List<StepikBlockRequest> steps = new ArrayList<>();
            for (int i = 0; i < jsonArrayParsed.size(); i++) {
                try {
                    Map<String, Object> jsonObj = jsonArrayParsed.get(i);

                    String jsonStr = objectMapper.writeValueAsString(jsonObj);
                    StepikBlockRequest step = responseParser.parseResponse(jsonStr, stepType);
                    steps.add(step);

                    log.info("Successfully parsed step {}/{} of type {}", i + 1, jsonArrayParsed.size(), stepType);
                } catch (Exception e) {
                    log.error("Failed to parse step {}/{} in batch: {}", i + 1, jsonArrayParsed.size(), e.getMessage());
                }
            }

            if (steps.isEmpty()) {
                throw new RuntimeException("No valid steps were parsed from the response. " +
                        "Original response: " + (aiResponse != null && aiResponse.length() > 500 
                        ? aiResponse.substring(0, 500) + "..." 
                        : aiResponse));
            }

            return steps;
        } catch (IllegalArgumentException e) {
            log.error("Failed to extract JSON array from response. Response length: {}, " +
                    "Response content: {}", 
                    aiResponse != null ? aiResponse.length() : 0,
                    aiResponse != null && aiResponse.length() > 1000 
                        ? aiResponse.substring(0, 1000) + "..." 
                        : aiResponse);
            throw new RuntimeException("Не удалось извлечь JSON массив из ответа LLM. " +
                    "Ответ может быть некорректным или обрезанным. " +
                    "Детали: " + e.getMessage() + 
                    (aiResponse != null && aiResponse.length() < 500 
                        ? ". Полный ответ: " + aiResponse 
                        : ""), e);
        } catch (Exception e) {
            log.error("Failed to parse batch response. Response: {}", 
                    aiResponse != null && aiResponse.length() > 500 
                        ? aiResponse.substring(0, 500) + "..." 
                        : aiResponse, e);
            throw new RuntimeException("Ошибка при парсинге batch ответа: " + e.getMessage() + 
                    (aiResponse != null && aiResponse.length() < 300 
                        ? ". Ответ LLM: " + aiResponse 
                        : ""), e);
        }
    }

    private String extractJsonArray(String response) {
        if (response == null || response.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty response from AI");
        }
        String trimmed = response.trim();
        
        // Проверка на валидный JSON с массивом объектов
        if (trimmed.contains("\"batch\"") && !trimmed.contains("\"text\"")) {
            throw new IllegalArgumentException("Response contains 'batch' field but no objects with 'text' field. " +
                    "Model returned wrong format. Response: " + (trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed));
        }
        
        long meaningfulChars = trimmed.chars().filter(c -> c != '\u007f' && !Character.isWhitespace(c) && c != '\\').count();
        if (meaningfulChars < 30) {
            log.warn("Response contains mostly escape characters, likely invalid");
            throw new IllegalArgumentException("Response contains mostly escape characters and cannot be parsed");
        }
        
        trimmed = fixEscapedHtmlTags(trimmed);
        trimmed = removeMarkdownAndExtraText(trimmed);
        Pattern markdownPattern = Pattern.compile(
                "```(?:json)?\\s*(\\[.*?\\])\\s*```",
                Pattern.DOTALL
        );
        Matcher matcher = markdownPattern.matcher(trimmed);
        if (matcher.find()) {
            String json = matcher.group(1).trim();
            if (isValidJsonArray(json)) {
                return json;
            }
        }

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            if (isValidJsonArray(trimmed)) {
                return trimmed;
            }
        }

        int start = trimmed.indexOf('[');
        int end = trimmed.lastIndexOf(']');
        if (start != -1 && end != -1 && end > start) {
            String extracted = trimmed.substring(start, end + 1);
            if (isValidJsonArray(extracted)) {
                return extracted;
            }
        }

        Pattern objectPattern = Pattern.compile("\\{[^{}]*(?:\\{[^{}]*\\}[^{}]*)*\\}", Pattern.DOTALL);
        matcher = objectPattern.matcher(trimmed);
        List<String> objects = new ArrayList<>();
        while (matcher.find()) {
            String obj = matcher.group(0);
            if (isValidJsonObject(obj)) {
                objects.add(obj);
            }
        }

        if (!objects.isEmpty()) {
            String array = "[" + String.join(", ", objects) + "]";
            if (isValidJsonArray(array)) {
                return array;
            }
        }

        log.error("Failed to extract JSON array. Response details:");
        log.error("  - Length: {}", response.length());
        log.error("  - First 500 chars: {}", response.length() > 500 ? response.substring(0, 500) + "..." : response);
        log.error("  - Last 200 chars: {}", response.length() > 200 
                ? "..." + response.substring(response.length() - 200) 
                : response);
        log.error("  - Contains '[': {}", response.contains("["));
        log.error("  - Contains ']': {}", response.contains("]"));
        log.error("  - Contains '{': {}", response.contains("{"));
        log.error("  - Contains '}': {}", response.contains("}"));
        
        throw new IllegalArgumentException("Не найден валидный JSON массив в ответе. " +
                "Ответ LLM может быть некорректным, обрезанным или поврежденным. " +
                "Первые 500 символов ответа: " + 
                (response.length() > 500 ? response.substring(0, 500) + "..." : response));
    }

    private String fixEscapedHtmlTags(String text) {
        if (text == null) {
            return text;
        }
        text = text.replace("\\u007f", "");
        text = text.replace("\\u003c", "<");
        text = text.replace("\\u003e", ">");
        text = text.replace("\\\\u007f", "");
        text = text.replace("\\\\u003c", "<");
        text = text.replace("\\\\u003e", ">");
        return text;
    }

    private String extractPartialJsonArray(String response) {
        if (response.length() > 10000 || response.chars().allMatch(c -> c == '\u007f' || Character.isWhitespace(c))) {
            log.warn("Response too long or contains only escape characters, skipping partial extraction");
            return null;
        }
        
        List<String> validObjects = new ArrayList<>();
        int start = response.indexOf('[');
        if (start == -1) {
            start = response.indexOf('{');
        }
        if (start == -1) {
            return null;
        }
        
        int depth = 0;
        int objStart = -1;
        for (int i = start; i < response.length() && validObjects.size() < 10; i++) {
            char c = response.charAt(i);
            if (c == '{') {
                if (depth == 0) {
                    objStart = i;
                }
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0 && objStart != -1) {
                    String obj = response.substring(objStart, i + 1);
                    if ((obj.contains("\"text\"") || obj.contains("\"source\"")) && obj.length() > 20) {
                        try {
                            if (isValidJsonObject(obj)) {
                                validObjects.add(obj);
                            }
                        } catch (Exception e) {
                        }
                    }
                    objStart = -1;
                }
            }
        }
        
        if (validObjects.isEmpty()) {
            return null;
        }
        
        return "[" + String.join(", ", validObjects) + "]";
    }

    private String removeMarkdownAndExtraText(String text) {
        int firstBracket = text.indexOf('[');
        if (firstBracket > 0) {
            String beforeBracket = text.substring(0, firstBracket);
            if (beforeBracket.contains("```") || beforeBracket.contains("json")) {
                text = text.substring(firstBracket);
            }
        }
        return text.trim();
    }

    private boolean isValidJsonArray(String json) {
        try {
            objectMapper.readValue(json, new TypeReference<List<Object>>() {});
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isValidJsonObject(String json) {
        try {
            objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractJsonFromResponse(String response) {
        if (response == null || response.trim().isEmpty()) {
            throw new IllegalArgumentException("Empty response from AI");
        }

        String trimmed = response.trim();
        Pattern jsonPattern = Pattern.compile("```json\\s*(.*?)\\s*```", Pattern.DOTALL);
        Matcher matcher = jsonPattern.matcher(trimmed);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }

        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
            return trimmed.substring(start, end + 1);
        }

        throw new IllegalArgumentException("No JSON found in response");
    }

}
