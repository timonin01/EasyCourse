package org.core.service.agent.course.tools.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.tools.AgentStepResponse;
import org.core.dto.agent.tools.CourseToolCall;
import org.core.service.agent.batch.BatchStepParser;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class AgentStepResponseParser {

    private static final Pattern TOOL_CALLS_ARRAY = Pattern.compile(
            "\"toolCalls\"\\s*:\\s*(\\[[\\s\\S]*?])",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SINGLE_TOOL_CALL = Pattern.compile(
            "\\{\\s*\"name\"\\s*:\\s*\"([A-Z_]+)\"\\s*,\\s*\"args\"\\s*:\\s*(\\{[\\s\\S]*?})\\s*}",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MESSAGE_FIELD = Pattern.compile(
            "\"message\"\\s*:\\s*(\"(?:[^\"\\\\]|\\\\.)*\"|null)",
            Pattern.CASE_INSENSITIVE);

    private final ObjectMapper objectMapper;
    private final BatchStepParser batchStepParser;

    public AgentStepResponse parse(String aiResponse) {
        String json = batchStepParser.extractJsonFromResponse(aiResponse);
        try {
            return objectMapper.readValue(json, AgentStepResponse.class);
        } catch (Exception strictError) {
            log.warn("Strict agent step JSON parse failed: {}", strictError.getMessage());
        }

        String repaired = repairCommonJsonIssues(json);
        if (!repaired.equals(json)) {
            try {
                return objectMapper.readValue(repaired, AgentStepResponse.class);
            } catch (Exception repairError) {
                log.warn("Repaired agent step JSON parse failed: {}", repairError.getMessage());
            }
        }

        AgentStepResponse fallback = extractFallback(json);
        if (fallback.getToolCalls() != null && !fallback.getToolCalls().isEmpty()) {
            log.info("Recovered {} tool call(s) from malformed agent JSON", fallback.getToolCalls().size());
            return fallback;
        }

        throw new IllegalArgumentException("No tool calls found in malformed agent response");
    }

    private String repairCommonJsonIssues(String json) {
        String repaired = json;
        repaired = repaired.replaceAll("(\"\\s*)\\r?\\n(\\s*\"toolCalls\")", "$1,\n$2");
        repaired = repaired.replaceAll("(\"\\s*)\\r?\\n(\\s*\"message\")", "$1,\n$2");
        return repaired;
    }

    private AgentStepResponse extractFallback(String json) {
        AgentStepResponse response = new AgentStepResponse();

        Matcher messageMatcher = MESSAGE_FIELD.matcher(json);
        if (messageMatcher.find()) {
            String rawMessage = messageMatcher.group(1);
            if (!"null".equalsIgnoreCase(rawMessage)) {
                try {
                    response.setMessage(objectMapper.readValue(rawMessage, String.class));
                } catch (Exception ignored) {
                    response.setMessage(rawMessage.replaceAll("^\"|\"$", ""));
                }
            }
        }

        Matcher toolCallsMatcher = TOOL_CALLS_ARRAY.matcher(json);
        if (toolCallsMatcher.find()) {
            List<CourseToolCall> toolCalls = parseToolCallsArray(toolCallsMatcher.group(1));
            if (!toolCalls.isEmpty()) {
                response.setToolCalls(toolCalls);
                return response;
            }
        }

        List<CourseToolCall> toolCalls = new ArrayList<>();
        Matcher singleMatcher = SINGLE_TOOL_CALL.matcher(json);
        while (singleMatcher.find()) {
            CourseToolCall call = parseSingleToolCall(singleMatcher.group(1), singleMatcher.group(2));
            if (call != null) {
                toolCalls.add(call);
            }
        }
        response.setToolCalls(toolCalls);
        return response;
    }

    private List<CourseToolCall> parseToolCallsArray(String arrayJson) {
        try {
            List<CourseToolCall> parsed = objectMapper.readValue(arrayJson, new TypeReference<>() {});
            return parsed == null ? List.of() : parsed;
        } catch (Exception ex) {
            log.warn("Failed to parse toolCalls array: {}", ex.getMessage());
            return List.of();
        }
    }

    private CourseToolCall parseSingleToolCall(String name, String argsJson) {
        try {
            CourseToolCall call = new CourseToolCall();
            call.setName(name);
            call.setArgs(objectMapper.readValue(argsJson, new TypeReference<>() {}));
            return call;
        } catch (Exception ex) {
            log.warn("Failed to parse tool call {}: {}", name, ex.getMessage());
            return null;
        }
    }
}
