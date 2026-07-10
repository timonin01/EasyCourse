package org.core.service.agent.course.router;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.batch.BatchStepParser;
import org.core.service.agent.course.CourseIntentResult;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class LlmCourseIntentRouter implements CourseIntentClassifier {

    @Value("${course.intent.router.max.tokens}")
    private int maxTokens;

    @Value("${course.intent.router.classifier.prompt}")
    private String classifierPrompt;

    private final LlmProvider llmProvider;
    private final SystemPromptService systemPromptService;
    private final BatchStepParser batchStepParser;
    private final ObjectMapper objectMapper;

    public LlmCourseIntentRouter(SystemPromptService systemPromptService,
                                 BatchStepParser batchStepParser,
                                 ObjectMapper objectMapper,
                                 @Value("${default.llm.provider}") String defaultProvider,
                                 @Qualifier("yandexProvider") LlmProvider yandexProvider,
                                 @Qualifier("deepseekProvider") LlmProvider deepseekProvider) {
        this.systemPromptService = systemPromptService;
        this.batchStepParser = batchStepParser;
        this.objectMapper = objectMapper;
        this.llmProvider = "yandex".equalsIgnoreCase(defaultProvider) ? yandexProvider : deepseekProvider;
    }

    @Override
    public CourseIntentResult classify(String userInput) {
        return classify(userInput, List.of());
    }

    @Override
    public CourseIntentResult classify(String userInput, List<ChatMessage> history) {
        try {
            String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(classifierPrompt);
            List<ChatMessage> messages = new ArrayList<>();
            messages.add(ChatMessage.builder().role("system").content(systemPrompt).build());
            if (history != null) {
                messages.addAll(history);
            }
            messages.add(ChatMessage.builder().role("user").content(userInput).build());

            String aiResponse = llmProvider.chat(messages, null, maxTokens);
            String json = batchStepParser.extractJsonFromResponse(aiResponse);
            JsonNode node = objectMapper.readTree(json);

            CourseAgentIntent intent = parseIntent(text(node, "intent"));
            CourseIntentResult result = new CourseIntentResult(
                    intent,
                    text(node, "sectionHint"),
                    text(node, "lessonHint"),
                    text(node, "stepHint"));
            log.info("LLM intent for '{}': {} (sectionHint={}, lessonHint={}, stepHint={})",
                    userInput, result.intent(), result.sectionHint(), result.lessonHint(), result.stepHint());
            return result;
        } catch (Exception e) {
            log.warn("LLM intent classification failed for '{}': {}", userInput, e.getMessage());
            return CourseIntentResult.of(CourseAgentIntent.UNKNOWN);
        }
    }

    private CourseAgentIntent parseIntent(String raw) {
        if (raw == null) {
            return CourseAgentIntent.UNKNOWN;
        }
        try {
            return CourseAgentIntent.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return CourseAgentIntent.UNKNOWN;
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) {
            return null;
        }
        return text;
    }
}
