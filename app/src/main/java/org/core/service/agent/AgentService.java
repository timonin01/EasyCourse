package org.core.service.agent;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class AgentService {
    
    private final ContextStore contextStore;
    private final LlmProvider llmProvider;
    private final SystemPromptService systemPromptService;
    private final StepikResponseParser responseParser;

    public AgentService(ContextStore contextStore,
                        SystemPromptService systemPromptService,
                        StepikResponseParser responseParser,
                        @Value("${default.llm.provider}") String defaultProvider,
                        @Qualifier("yandexProvider") LlmProvider yandexProvider,
                        @Qualifier("deepseekProvider") LlmProvider deepseekProvider){
        this.systemPromptService = systemPromptService;
        this.responseParser = responseParser;
        this.contextStore = contextStore;
        this.llmProvider = "yandex".equalsIgnoreCase(defaultProvider) ? yandexProvider : deepseekProvider;
    }
    
    public String handleUserMessage(String sessionId, String userInput) {
        try {
            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);
            
            List<ChatMessage> history = contextStore.getHistory(sessionId);
            
            String assistantReply = llmProvider.chat(history);
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
            Optional<String> existingStepType = extractStepTypeFromHistory(history);
            if (existingStepType.isPresent()) {
                if (!existingStepType.get().equals(stepType)) {
                    String errorMsg = String.format(
                        "Session '%s' is already configured for step type '%s', but received request for '%s'. " +
                        "Please use a new session ID or clear the current session using DELETE /api/agent/session/%s",
                        sessionId, existingStepType.get(), stepType, sessionId
                    );
                    throw new RuntimeException(errorMsg);
                }
            } else {
                String systemPrompt = systemPromptService.getPromptForStepType(stepType);
                ChatMessage systemMessage = ChatMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .stepType(stepType)
                        .build();
                contextStore.addMessage(sessionId, systemMessage);
                log.info("Initialized session {} with system prompt for step type {}", sessionId, stepType);
            }

            ChatMessage userMessage = ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build();
            contextStore.addMessage(sessionId, userMessage);
            history = contextStore.getHistory(sessionId);
            String aiResponse = llmProvider.chat(history);
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
