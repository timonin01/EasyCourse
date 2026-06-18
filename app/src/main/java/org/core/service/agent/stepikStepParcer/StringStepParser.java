package org.core.service.agent.stepikStepParcer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.enterWord.string.request.StepikBlockStringRequest;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StringStepParser {

    private static final Pattern QUOTED_TERM = Pattern.compile("[\"«]([^\"»]{2,60})[\"»]");
    private static final Pattern CAPITALIZED_PHRASE = Pattern.compile("\\b([A-Z][a-z]+(?: [A-Z][a-z]+)+)\\b");
    private static final Pattern AFTER_DEFINITION = Pattern.compile(
            "(?:такое|называется|термин|понятие)\\s+([A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9 _-]{1,50})",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private final ObjectMapper objectMapper;

    public StepikBlockRequest parseStringRequest(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            if (node.isObject()) {
                ObjectNode objectNode = (ObjectNode) node;
                if (!objectNode.has("name") || objectNode.get("name").isNull()) {
                    objectNode.put("name", "string");
                }
            }
            String jsonWithName = objectMapper.writeValueAsString(node);
            StepikBlockStringRequest request = objectMapper.readValue(jsonWithName, StepikBlockStringRequest.class);
            fixEmptyPattern(request);
            if (!validateStringRequest(request)) {
                throw new IllegalArgumentException("Invalid string request structure");
            }
            return request;
        } catch (Exception e) {
            log.error("Failed to parse string request: {}", e.getMessage(), e);
            throw new RuntimeException("Invalid string request format", e);
        }
    }

    private void fixEmptyPattern(StepikBlockStringRequest request) {
        if (request == null || request.getSource() == null) {
            return;
        }
        String pattern = request.getSource().getPattern();
        if (pattern != null && !pattern.trim().isEmpty()) {
            return;
        }

        String extracted = extractLikelyAnswerTerm(request.getText());
        if (extracted != null) {
            log.warn("String request had empty pattern, auto-filled from task text: '{}'", extracted);
            request.getSource().setPattern(extracted);
            request.getSource().setMatchSubstring(true);
            request.getSource().setCaseSensitive(false);
            return;
        }

        log.warn("String request had empty pattern and no term could be extracted, using permissive fallback");
        request.getSource().setPattern("\\S{2,}");
        request.getSource().setUseRe(true);
        request.getSource().setMatchSubstring(false);
        request.getSource().setCaseSensitive(false);
    }

    private String extractLikelyAnswerTerm(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        Matcher quotedMatcher = QUOTED_TERM.matcher(text);
        if (quotedMatcher.find()) {
            return quotedMatcher.group(1).trim();
        }

        Matcher capitalizedMatcher = CAPITALIZED_PHRASE.matcher(text);
        if (capitalizedMatcher.find()) {
            return capitalizedMatcher.group(1).trim();
        }

        Matcher definitionMatcher = AFTER_DEFINITION.matcher(text);
        if (definitionMatcher.find()) {
            String candidate = definitionMatcher.group(1).trim();
            candidate = candidate.replaceAll("[?.!,;:]+$", "").trim();
            if (!candidate.isEmpty()) {
                return candidate;
            }
        }

        return null;
    }

    private boolean validateStringRequest(StepikBlockStringRequest request) {
        if (request == null || request.getText() == null || request.getText().trim().isEmpty()) {
            log.warn("String request validation failed: empty text");
            return false;
        }

        if (request.getSource() == null) {
            log.warn("String request validation failed: missing source");
            return false;
        }

        if (request.getSource().getPattern() == null || request.getSource().getPattern().trim().isEmpty()) {
            log.warn("String request validation failed: missing pattern");
            return false;
        }

        return true;
    }
}

