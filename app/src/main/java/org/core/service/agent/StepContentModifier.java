package org.core.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.dto.agent.ChatMessage;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@Slf4j
public class StepContentModifier {

    private final ObjectMapper objectMapper;
    private final ContextStore contextStore;
    private final SystemPromptService systemPromptService;
    private final StepikResponseParser responseParser;
    private final LlmProvider llmProvider;
    private final LlmModelConfig llmModelConfig;

    public StepContentModifier(ObjectMapper objectMapper,
                               ContextStore contextStore,
                               SystemPromptService systemPromptService,
                               StepikResponseParser responseParser,
                               @Qualifier("yandexProvider") LlmProvider yandexProvider,
                               LlmModelConfig llmModelConfig){
        this.objectMapper = objectMapper;
        this.contextStore = contextStore;
        this.systemPromptService = systemPromptService;
        this.responseParser = responseParser;
        this.llmProvider = yandexProvider;
        this.llmModelConfig = llmModelConfig;
    }

    public StepikBlockRequest modifyStepContent(String sessionId, String userInput, String stepType, StepikBlockRequest stepikBlockRequest, LlmModel llmModel) {
        try {
            List<ChatMessage> history = contextStore.getHistory(sessionId);
            List<ChatMessage> historyForLLM = new ArrayList<>();

            Optional<String> existingStepType = extractStepTypeFromHistory(contextStore.getHistory(sessionId));
            if(existingStepType.isEmpty() || !existingStepType.get().equals(stepType)) {
                String systemPrompt = systemPromptService.getPromptForQuery(stepType);
                ChatMessage systemMessage = ChatMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .stepType(stepType)
                        .build();
                contextStore.addMessage(sessionId, systemMessage);
                log.info("Initialized session {} with system prompt for step type {}", sessionId, stepType);

                historyForLLM.add(systemMessage);
            }else{
                ChatMessage lastSystemPrompt = history.stream()
                        .filter(msg -> "system".equals(msg.getRole()))
                        .reduce((first, second) -> second)
                        .orElse(null);
                if (lastSystemPrompt != null) {
                    historyForLLM.add(lastSystemPrompt);
                }
            }

            String messageWithPrevBlockRequestAndNewUserInput = String.format(
                    "Текущий контент шага (JSON):\n%s\n\nЗапрос пользователя: %s",
                    objectMapper.writeValueAsString(stepikBlockRequest),
                    userInput
            );

            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(messageWithPrevBlockRequestAndNewUserInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);
            historyForLLM.addAll(processHistoryMessage(sessionId));

            String modelUri = llmModel != null ? llmModelConfig.getModelUri(llmModel) : null;
            String aiResponse = modelUri != null && !modelUri.trim().isEmpty()
                    ? llmProvider.chat(historyForLLM, modelUri)
                    : llmProvider.chat(historyForLLM);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(aiResponse)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);

            StepikBlockRequest stepikRequest = responseParser.parseResponse(aiResponse, stepType);
            log.info("Successfully generated step for session {}, step type: {}, model: {}", sessionId, stepType, llmModel);
            return stepikRequest;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating step for session {}: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate step. Please try again.", e);
        }
    }

    private List<ChatMessage> processHistoryMessage(String sessionId) {
        List<ChatMessage> history = contextStore.getHistory(sessionId);
        int windowSize = 16;
        if (history.isEmpty()) return history;

        int startIndex = Math.max(0, history.size() - windowSize);
        return history.subList(startIndex, history.size())
                .stream()
                .filter(chatMessage -> !chatMessage.getRole().equals("system"))
                .toList();
    }

    private Optional<String> extractStepTypeFromHistory(List<ChatMessage> history) {
        return history.stream()
                .filter(msg -> "system".equals(msg.getRole()))
                .findFirst()
                .map(ChatMessage::getStepType);
    }

}
