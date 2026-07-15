package org.core.service.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.exception.exceptions.ProvodAiException;
import org.core.service.AiService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class ProvodAiService implements AiService {

    private final OpenAIClient provodAiClient;

    @Value("${provod.api.model-name.default}")
    private String defaultModel;

    public ProvodAiService(@Qualifier("provodAiClient") OpenAIClient provodAiClient) {
        this.provodAiClient = provodAiClient;
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt) {
        return generateResponse(messages, hasSystemPrompt, 2000);
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens) {
        return generateResponse(messages, hasSystemPrompt, maxTokens, defaultModel);
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, String modelId) {
        return generateResponse(messages, hasSystemPrompt, 2000, modelId, false);
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens, String modelId) {
        return generateResponse(messages, hasSystemPrompt, maxTokens, modelId, false);
    }

    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens, String customModelId, boolean jsonObject) {
        if (messages == null || messages.isEmpty()) {
            throw new ProvodAiException("Messages cannot be empty");
        }

        String modelToUse = customModelId != null && !customModelId.isBlank() ? customModelId : defaultModel;
        log.info("Sending request to Provod AI (model: {}): {} messages", modelToUse, messages.size());
        try {
            ChatCompletionCreateParams.Builder paramsBuilder = ChatCompletionCreateParams.builder()
                    .model(modelToUse)
                    .maxCompletionTokens(maxTokens)
                    .temperature(0.6);

            for (ChatMessage message : messages) {
                switch (message.getRole()) {
                    case "system" -> paramsBuilder.addSystemMessage(message.getContent());
                    case "assistant" -> paramsBuilder.addAssistantMessage(message.getContent());
                    default -> paramsBuilder.addUserMessage(message.getContent());
                }
            }

            ChatCompletion completion = provodAiClient.chat().completions().create(paramsBuilder.build());
            if (completion.usage().isPresent()) {
                var usage = completion.usage().get();
                log.info("Provod AI usage (model: {}): prompt={}, completion={}, total={}",
                        modelToUse,
                        usage.promptTokens(),
                        usage.completionTokens(),
                        usage.totalTokens());
            }

            String content = completion.choices().stream()
                    .flatMap(choice -> choice.message().content().stream())
                    .findFirst()
                    .orElse(null);
            if (content != null && !content.isBlank()) {
                return content;
            }
            throw new ProvodAiException("No response from Provod AI");
        } catch (ProvodAiException e) {
            throw e;
        } catch (RuntimeException e) {
            log.error("Error calling Provod AI API (model: {}): {}", modelToUse, e.getMessage(), e);
            throw new ProvodAiException("Sorry, I couldn't generate a response at the moment.");
        }
    }
}
