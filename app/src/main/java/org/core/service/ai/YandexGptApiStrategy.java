package org.core.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class YandexGptApiStrategy {

    private final YandexGptService yandexGptService;
    private final YandexGptOpenAiService openAiService;

    public boolean requiresOpenAiApi(String modelUri) {
        if (modelUri == null || modelUri.isEmpty()) {
            return false;
        }
        String uriLower = modelUri.toLowerCase();
        return uriLower.contains("qwen") || uriLower.contains("gemma");
    }


    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, String modelUri, int maxTokens) {
        if (requiresOpenAiApi(modelUri)) {
            return openAiService.generateResponse(messages, modelUri, maxTokens);
        } else {
            return yandexGptService.generateResponse(messages, hasSystemPrompt, maxTokens, modelUri, false);
        }
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt) {
        return yandexGptService.generateResponse(messages, hasSystemPrompt);
    }
}
