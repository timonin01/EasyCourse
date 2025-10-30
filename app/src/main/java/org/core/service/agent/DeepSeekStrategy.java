package org.core.service.agent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.service.ai.DeepSeekService;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("deepseekProvider")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class DeepSeekStrategy implements LlmProvider {
    
    private final DeepSeekService deepSeekService;
    
    @Override
    public String chat(List<ChatMessage> messages) {
        try {
            String prompt = buildPrompt(messages);
            return deepSeekService.generateResponse(prompt);
        } catch (Exception e) {
            log.error("Error in DeepSeek adapter: {}", e.getMessage());
            throw new RuntimeException("Failed to get response from DeepSeek: " + e.getMessage());
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
