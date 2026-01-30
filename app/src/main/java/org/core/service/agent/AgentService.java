package org.core.service.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class AgentService {

    private final ObjectMapper objectMapper;
    private final ContextStore contextStore;
    private final LlmProvider llmProvider;
    private final SystemPromptService systemPromptService;
    private final StepikResponseParser responseParser;
    private final StepTypeClassifier stepTypeClassifier;

    public AgentService(ObjectMapper objectMapper, ContextStore contextStore,
                        SystemPromptService systemPromptService,
                        StepikResponseParser responseParser,
                        StepTypeClassifier stepTypeClassifier,
                        @Value("${default.llm.provider}") String defaultProvider,
                        @Qualifier("yandexProvider") LlmProvider yandexProvider,
                        @Qualifier("deepseekProvider") LlmProvider deepseekProvider){
        this.objectMapper = objectMapper;
        this.systemPromptService = systemPromptService;
        this.responseParser = responseParser;
        this.contextStore = contextStore;
        this.stepTypeClassifier = stepTypeClassifier;
        this.llmProvider = "yandex".equalsIgnoreCase(defaultProvider) ? yandexProvider : deepseekProvider;
    }
    
    public String handleUserMessage(String sessionId, String userInput) {
        try {
            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);
            
            List<ChatMessage> historyForLLM = processHistoryMessage(sessionId);
            
            String assistantReply = llmProvider.chat(historyForLLM);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(assistantReply)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);
            
            log.info("Agent response for session {}: {}", sessionId, assistantReply);
            return assistantReply;
        } catch (Exception e) {
            log.error("Error handling user message for session {}: {}", sessionId, e.getMessage());
            return "Error handling user message for session. Try again.";
        }
    }

    public StepikBlockRequest generateStep(String sessionId, String userInput, String stepType) {
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

            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);
            historyForLLM.addAll(processHistoryMessage(sessionId));

            String aiResponse = llmProvider.chat(historyForLLM);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(aiResponse)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);
            
            StepikBlockRequest stepikRequest = responseParser.parseResponse(aiResponse, stepType);
            log.info("Successfully generated step for session {}, step type: {}", sessionId, stepType);
            return stepikRequest;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating step for session {}: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate step. Please try again.", e);
        }
    }

    public StepikBlockRequest modifyStepContent(String sessionId, String userInput, String stepType, StepikBlockRequest stepikBlockRequest) {
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

            String aiResponse = llmProvider.chat(historyForLLM);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(aiResponse)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);

            StepikBlockRequest stepikRequest = responseParser.parseResponse(aiResponse, stepType);
            log.info("Successfully generated step for session {}, step type: {}", sessionId, stepType);
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
    
    public void clearSession(String sessionId) {
        contextStore.clearSession(sessionId);
        log.info("Cleared session: {}", sessionId);
    }
}
