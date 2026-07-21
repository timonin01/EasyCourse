package org.core.service.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.ResponseFormatJsonObject;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionCreateParams.ResponseFormat;
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
        try {
            return callCompletion(messages, maxTokens, modelToUse, jsonObject);
        } catch (ProvodAiException e) {
            throw e;
        } catch (RuntimeException e) {
            if (jsonObject && shouldRetryWithoutJsonMode(e)) {
                log.warn("Provod AI json_object mode rejected for model {}, retrying without response_format",
                        modelToUse);
                try {
                    return callCompletion(messages, maxTokens, modelToUse, false);
                } catch (ProvodAiException retryEx) {
                    throw retryEx;
                } catch (RuntimeException retryEx) {
                    log.error("Error calling Provod AI API after JSON fallback (model: {}): {}",
                            modelToUse, retryEx.getMessage(), retryEx);
                    throw new ProvodAiException("Sorry, I couldn't generate a response at the moment.");
                }
            }
            log.error("Error calling Provod AI API (model: {}): {}", modelToUse, e.getMessage(), e);
            throw new ProvodAiException("Sorry, I couldn't generate a response at the moment.");
        }
    }

    private String callCompletion(List<ChatMessage> messages, int maxTokens, String modelToUse, boolean jsonObject) {
        log.info("Sending request to Provod AI (model: {}, jsonObject: {}): {} messages",
                modelToUse, jsonObject, messages.size());
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

        if (jsonObject) {
            paramsBuilder.responseFormat(ResponseFormat.ofJsonObject(ResponseFormatJsonObject.builder().build()));
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
    }

    private boolean shouldRetryWithoutJsonMode(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            String className = current.getClass().getSimpleName();
            if (className.contains("BadRequest")) {
                return true;
            }
            String message = current.getMessage();
            if (message == null) {
                continue;
            }
            String lower = message.toLowerCase();
            if (lower.contains("400")
                    || lower.contains("bad request")
                    || lower.contains("response_format")
                    || lower.contains("json_object")
                    || lower.contains("could not process this request")
                    || lower.contains("not support")) {
                return true;
            }
        }
        return false;
    }
}
