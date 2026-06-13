package org.core.service.ai;

import com.openai.client.OpenAIClient;
import com.openai.models.responses.Response;
import com.openai.models.responses.ResponseCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.exception.exceptions.YandexGptException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class YandexAiStudioService {

    private final OpenAIClient yandexAiStudioClient;

    public String generateResponse(List<ChatMessage> messages, int maxTokens, String modelUri) {
        try {
            String instructions = buildInstructions(messages);
            String input = buildInput(messages);

            ResponseCreateParams params = ResponseCreateParams.builder()
                    .model(modelUri)
                    .temperature(0.6)
                    .instructions(instructions)
                    .input(input)
                    .maxOutputTokens(maxTokens)
                    .build();
            log.info("Sending request to Yandex AI Studio (model: {}): inputLength={}, instructionsLength={}",
                    modelUri, input.length(), instructions.length());

            var response = yandexAiStudioClient.responses().create(params);
            String output = extractOutputText(response);

            if (output == null || output.isBlank()) {
                throw new YandexGptException("No response from Yandex AI Studio");
            }
            log.info("Response from Yandex AI Studio (model: {}): {}", modelUri, output);
            return output;
        } catch (RuntimeException e) {
            log.error("Error calling Yandex AI Studio API (model: {}): {}", modelUri, e.getMessage());
            throw new YandexGptException("Sorry, I couldn't generate a response at the moment.");
        }
    }

    public static boolean requiresAiStudioApi(String modelUri) {
        if (modelUri == null || modelUri.isBlank()) {
            return false;
        }
        String uri = modelUri.toLowerCase();
        return uri.contains("/qwen") || uri.contains("/gpt-oss") || uri.contains("/deepseek");
    }

    private String buildInstructions(List<ChatMessage> messages) {
        return messages.stream()
                .filter(message -> "system".equals(message.getRole()))
                .map(ChatMessage::getContent)
                .collect(Collectors.joining("\n\n"));
    }

    private String buildInput(List<ChatMessage> messages) {
        StringBuilder input = new StringBuilder();

        for (ChatMessage message : messages) {
            if ("system".equals(message.getRole())) {
                continue;
            }

            switch (message.getRole()) {
                case "user" -> input.append("Пользователь: ").append(message.getContent()).append("\n\n");
                case "assistant" -> input.append("Ассистент: ").append(message.getContent()).append("\n\n");
                default -> input.append(message.getContent()).append("\n\n");
            }
        }

        return input.toString().trim();
    }

    private String extractOutputText(Response response) {
        if (response.output() == null) {
            return "";
        }

        return response.output().stream()
                .flatMap(item -> item.message().stream())
                .flatMap(message -> message.content().stream())
                .flatMap(content -> content.outputText().stream())
                .map(text -> text.text())
                .collect(Collectors.joining("\n"));
    }
}
