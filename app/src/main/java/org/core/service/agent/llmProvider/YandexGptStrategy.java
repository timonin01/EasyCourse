package org.core.service.agent.llmProvider;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.service.ai.YandexGptApiStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("yandexProvider")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class YandexGptStrategy implements LlmProvider {
    
    private final YandexGptApiStrategy apiStrategy;
    
    @Value("${max.tokens.default}")
    private Integer maxTokensDefault;
    
    @Override
    public String chat(List<ChatMessage> messages) {
        try {
            boolean hasSystemPrompt = messages.stream()
                    .anyMatch(chatMessage -> chatMessage.getRole().equals("system"));

            return apiStrategy.generateResponse(messages, hasSystemPrompt);
        } catch (Exception e) {
            log.error("Error in YandexGPT adapter: {}", e.getMessage());
            throw new RuntimeException("Failed to get response from YandexGPT: " + e.getMessage());
        }
    }

    @Override
    public String chat(List<ChatMessage> messages, String modelUri){
        if(modelUri == null || modelUri.trim().isEmpty()) return chat(messages);
        try {
            boolean hasSystemPrompt = messages.stream()
                    .anyMatch(chatMessage -> chatMessage.getRole().equals("system"));

            return apiStrategy.generateResponse(messages, hasSystemPrompt, modelUri, maxTokensDefault);
        } catch (Exception e) {
            log.error("Error in YandexGPT adapter: {}, with modelUri: {}", e.getMessage(), modelUri);
            throw new RuntimeException("Failed to get response from YandexGPT: " + e.getMessage());
        }
    }
}
