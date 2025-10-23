package org.core.service.agent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class AgentService {
    
    private final ContextStore contextStore;
    private final LlmProvider llmProvider;
    
    @Value("${default.llm.provider}")
    private String defaultProvider;

    public AgentService(ContextStore contextStore,
                        @Qualifier("yandexProvider") LlmProvider yandexProvider,
                        @Qualifier("deepseekProvider") LlmProvider deepseekProvider){
        this.contextStore = contextStore;
        if(deepseekProvider.equals("yandexProvider"))  this.llmProvider = yandexProvider;
        else this.llmProvider = deepseekProvider;
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
    
    public String startSession(String sessionId, String systemPrompt) {
        try {
            ChatMessage systemMessage = ChatMessage.builder()
                    .role("system")
                    .content(systemPrompt)
                    .build();
            contextStore.addMessage(sessionId, systemMessage);

            List<ChatMessage> history = contextStore.getHistory(sessionId);

            String initialResponse = llmProvider.chat(history);
            ChatMessage assistantMessage = ChatMessage.builder()
                    .role("assistant")
                    .content(initialResponse)
                    .build();
            contextStore.addMessage(sessionId, assistantMessage);
            
            log.info("Started new session: {} with system prompt", sessionId);
            return initialResponse;
        } catch (Exception e) {
            log.error("Error starting session {}: {}", sessionId, e.getMessage());
            return "Error starting session";
        }
    }
    
    public List<ChatMessage> getSessionHistory(String sessionId) {
        return contextStore.getHistory(sessionId);
    }
    
    public void clearSession(String sessionId) {
        contextStore.clearSession(sessionId);
        log.info("Cleared session: {}", sessionId);
    }
}
