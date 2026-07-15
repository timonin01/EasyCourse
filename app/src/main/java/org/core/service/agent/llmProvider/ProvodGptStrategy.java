package org.core.service.agent.llmProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.service.ai.ProvodAiService;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;

@Primary
@Component("provodProvider")
@Slf4j
@RequiredArgsConstructor
public class ProvodGptStrategy implements LlmProvider{

    private final ProvodAiService provodAiService;

    @Override
    public String chat(List<ChatMessage> messages) {
        try {
            boolean hasSystemPrompt = messages.stream()
                    .anyMatch(chatMessage -> chatMessage.getRole().equals("system"));

            return provodAiService.generateResponse(messages, hasSystemPrompt);
        } catch (Exception e) {
            log.error("Error in ProvodAI adapter: {}", e.getMessage());
            throw new RuntimeException("Failed to get response from ProvodAi: " + e.getMessage());
        }
    }

    @Override
    public String chat(List<ChatMessage> messages, String modelUri){
        if(modelUri == null || modelUri.trim().isEmpty()) return chat(messages);
        try {
            boolean hasSystemPrompt = messages.stream()
                    .anyMatch(chatMessage -> chatMessage.getRole().equals("system"));

            return provodAiService.generateResponse(messages, hasSystemPrompt, modelUri);
        } catch (Exception e) {
            log.error("Error in ProvodAi adapter: {}, with modelUri: {}", e.getMessage(), modelUri);
            throw new RuntimeException("Failed to get response from ProvodAi: " + e.getMessage());
        }
    }

    @Override
    public String chat(List<ChatMessage> messages, String modelUri, int maxTokens) {
        try {
            boolean hasSystemPrompt = messages.stream()
                    .anyMatch(chatMessage -> chatMessage.getRole().equals("system"));

            if (modelUri == null || modelUri.trim().isEmpty()) {
                return provodAiService.generateResponse(messages, hasSystemPrompt, maxTokens);
            }
            return provodAiService.generateResponse(messages, hasSystemPrompt, maxTokens, modelUri);
        } catch (Exception e) {
            log.error("Error in ProvodAi adapter: {}, with modelUri: {}", e.getMessage(), modelUri);
            throw new RuntimeException("Failed to get response from ProvodAi: " + e.getMessage());
        }
    }
}
