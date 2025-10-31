package org.core.service.agent.llmProvider;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.service.ai.YandexGptService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("yandexProvider")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class YandexGptStrategy implements LlmProvider {
    
    private final YandexGptService yandexGptService;
    
    @Override
    public String chat(List<ChatMessage> messages) {
        try {
            String prompt = buildPrompt(messages);
            return yandexGptService.generateResponse(prompt);
        } catch (Exception e) {
            log.error("Error in YandexGPT adapter: {}", e.getMessage());
            throw new RuntimeException("Failed to get response from YandexGPT: " + e.getMessage());
        }
    }
    
    private String buildPrompt(List<ChatMessage> messages) {
        StringBuilder prompt = new StringBuilder();
        for (ChatMessage message : messages) {
            String role = message.getRole();
            String content = message.getContent();
            
            switch (role) {
                case "system":
                    prompt.append("Система: ").append(content).append("\n\n");
                    break;
                case "user":
                    prompt.append("Пользователь: ").append(content).append("\n\n");
                    break;
                case "assistant":
                    prompt.append("Ассистент: ").append(content).append("\n\n");
                    break;
            }
        }
        return prompt.toString();
    }
}
