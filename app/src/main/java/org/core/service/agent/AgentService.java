package org.core.service.agent;

import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.domain.ai.AiMessageRole;
import org.core.domain.ai.ChatType;
import org.core.dto.agent.ChatMessage;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.llmProvider.LlmProvider;
import org.core.service.ai.AiSessionMessageService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class AgentService {

    private final ContextStore contextStore;
    private final LlmProvider llmProvider;
    private final SystemPromptService systemPromptService;
    private final AiSessionMessageService aiSessionMessageService;
    private final StepikResponseParser responseParser;
    private final StepTypeClassifier stepTypeClassifier;
    private final LlmModelConfig llmModelConfig;

    public AgentService(ContextStore contextStore,
                        AiSessionMessageService aiSessionMessageService,
                        SystemPromptService systemPromptService,
                        StepikResponseParser responseParser,
                        StepTypeClassifier stepTypeClassifier,
                        LlmModelConfig llmModelConfig,
                        @Value("${default.llm.provider}") String defaultProvider,
                        @Qualifier("yandexProvider") LlmProvider yandexProvider,
                        @Qualifier("deepseekProvider") LlmProvider deepseekProvider){
        this.aiSessionMessageService = aiSessionMessageService;
        this.systemPromptService = systemPromptService;
        this.responseParser = responseParser;
        this.contextStore = contextStore;
        this.stepTypeClassifier = stepTypeClassifier;
        this.llmModelConfig = llmModelConfig;
        this.llmProvider = "yandex".equalsIgnoreCase(defaultProvider) ? yandexProvider : deepseekProvider;
    }

    public String handleUserMessage(Long userId, String sessionId, String userInput, LlmModel llmModel) {
        try {
            hydrateContextFromDbIfEmpty(userId, sessionId);

            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);

            aiSessionMessageService.saveMessageToChatHistory(userId,
                    sessionId,
                    AiMessageRole.USER,
                    ChatType.CHAT,
                    userInput,
                    null,
                    null);

            List<ChatMessage> historyForLLM = processHistoryMessage(sessionId);
            
            String modelUri = llmModel != null ? llmModelConfig.getModelUri(llmModel) : null;
            String assistantReply = modelUri != null && !modelUri.trim().isEmpty()
                    ? llmProvider.chat(historyForLLM, modelUri)
                    : llmProvider.chat(historyForLLM);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(assistantReply)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);

            aiSessionMessageService.saveMessageToChatHistory(userId,sessionId,
                    AiMessageRole.ASSISTANT,
                    ChatType.CHAT,
                    assistantMessage.getContent(),
                    null,
                    null);
            
            log.info("Agent response for session {} with model {}: {}", sessionId, llmModel, assistantReply);
            return assistantReply;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error handling user message for session {}: {}", sessionId, e.getMessage());
            return "Error handling user message for session. Try again.";
        }
    }

    public StepikBlockRequest generateStep(Long userId, String sessionId, String userInput, String stepType) {
        return generateStep(userId, sessionId, userInput, stepType, null, true);
    }

    public StepikBlockRequest generateStep(Long userId, String sessionId, String userInput, String stepType, LlmModel llmModel) {
        return generateStep(userId, sessionId, userInput, stepType, llmModel, true);
    }

    public StepikBlockRequest generateStep(Long userId,
                                           String sessionId,
                                           String userInput,
                                           String stepType,
                                           LlmModel llmModel,
                                           boolean persistHistory) {
        try {
            List<ChatMessage> historyForLLM = new ArrayList<>();

            if (persistHistory) {
                hydrateContextFromDbIfEmpty(userId, sessionId);

                List<ChatMessage> history = contextStore.getHistory(sessionId);
                Optional<String> existingStepType = extractStepTypeFromHistory(history);
                if (existingStepType.isEmpty() || !existingStepType.get().equals(stepType)) {
                    String systemPrompt = systemPromptService.getPromptForQuery(stepType);
                    ChatMessage systemMessage = ChatMessage.builder()
                            .role("system")
                            .content(systemPrompt)
                            .stepType(stepType)
                            .build();
                    contextStore.addMessage(sessionId, systemMessage);
                    log.info("Initialized session {} with system prompt for step type {}", sessionId, stepType);
                    historyForLLM.add(systemMessage);
                } else {
                    ChatMessage lastSystemPrompt = history.stream()
                            .filter(msg -> "system".equals(msg.getRole()))
                            .reduce((first, second) -> second)
                            .orElse(null);
                    if (lastSystemPrompt != null) {
                        historyForLLM.add(lastSystemPrompt);
                    }
                }

                ChatMessage userMessage = ChatMessage.builder()
                        .role("user")
                        .content(userInput)
                        .build();
                contextStore.addMessage(sessionId, userMessage);
                historyForLLM.addAll(processHistoryMessage(sessionId));
                aiSessionMessageService.saveMessageToChatHistory(
                        userId,
                        sessionId,
                        AiMessageRole.USER,
                        ChatType.GENERATE,
                        userInput,
                        stepType,
                        null);
            } else {
                String systemPrompt = systemPromptService.getPromptForQuery(stepType);
                historyForLLM.add(ChatMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .stepType(stepType)
                        .build());
                historyForLLM.add(ChatMessage.builder()
                        .role("user")
                        .content(userInput)
                        .build());
            }

            String modelUri = llmModel != null ? llmModelConfig.getModelUri(llmModel) : null;
            String aiResponse = modelUri != null && !modelUri.trim().isEmpty()
                    ? llmProvider.chat(historyForLLM, modelUri)
                    : llmProvider.chat(historyForLLM);
            if (persistHistory) {
                ChatMessage assistantMessage = ChatMessage.builder()
                        .role("assistant")
                        .content(aiResponse)
                        .build();
                contextStore.addMessage(sessionId, assistantMessage);
            }

            StepikBlockRequest stepikRequest = responseParser.parseResponse(aiResponse, stepType);
            if (persistHistory) {
                aiSessionMessageService.saveMessageToChatHistory(
                        userId,
                        sessionId,
                        AiMessageRole.ASSISTANT,
                        ChatType.GENERATE,
                        "Сгенерирован шаг типа \"" + stepType + "\"",
                        stepType,
                        stepikRequest);
            }

            log.info("Successfully generated step for session {}, step type: {}, model: {}, persistHistory: {}",
                    sessionId, stepType, llmModel, persistHistory);
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

    public String classifyStepTypeFromUserInput(String userInput){
        return stepTypeClassifier.detectStepType(userInput);
    }

    private Optional<String> extractStepTypeFromHistory(List<ChatMessage> history) {
        return history.stream()
                .filter(msg -> "system".equals(msg.getRole()))
                .findFirst()
                .map(ChatMessage::getStepType);
    }

    public List<ChatMessage> getSessionHistory(String sessionId) {
        return contextStore.getHistory(sessionId);
    }
    
    public void clearSession(Long userId, String sessionId) {
        aiSessionMessageService.clearSession(userId, sessionId);
        contextStore.clearSession(sessionId);
        log.info("Cleared session in database and memory: {}", sessionId);
    }

    private void hydrateContextFromDbIfEmpty(Long userId, String sessionId) {
        if (!contextStore.getHistory(sessionId).isEmpty()) {
            return;
        }

        List<AiMessageHistoryDTO> dbHistory = aiSessionMessageService.getSessionHistory(userId, sessionId);
        for (AiMessageHistoryDTO message : dbHistory) {
            contextStore.addMessage(sessionId, ChatMessage.builder()
                    .role(message.getRole())
                    .content(message.getContent())
                    .stepType(message.getStepType())
                    .build());
        }

        if (!dbHistory.isEmpty()) {
            log.info("Hydrated {} messages from database into context for session {}", dbHistory.size(), sessionId);
        }
    }
}
