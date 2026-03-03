package org.core.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.exception.exceptions.YandexGptException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class YandexGptOpenAiService {

    @Value("${yandex.gpt.api.key}")
    private String apiKey;

    @Value("${yandex.gpt.api.openai.url:https://ai.api.cloud.yandex.net/v1.2/chat/completions}")
    private String openAiApiUrl;

    @Value("${max.tokens.default}")
    private Integer maxTokensDefault;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, String modelUri, int maxTokens) {
        if (messages == null || messages.isEmpty()) {
            throw new YandexGptException("Messages cannot be empty");
        }

        try {
            Map<String, Object> requestBody = createOpenAiFormatRequest(messages, modelUri, maxTokens);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Authorization", "Api-Key " + apiKey);
            headers.set("x-folder-id", "b1grl0e87ma0oc0sae8c");
            headers.set("x-data-logging-enabled", "false");
            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(requestBody),
                    headers
            );

            ResponseEntity<String> response = restTemplate.exchange(
                    openAiApiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Response from Yandex AI Studio OpenAI-compatible API: {}", response.getBody());
                return parseOpenAiFormatResponse(response.getBody());
            }

            throw new YandexGptException("No response from Yandex AI Studio OpenAI-compatible API");

        } catch (Exception e) {
            log.error("Error calling Yandex AI Studio OpenAI-compatible API: {}", e.getMessage(), e);
            throw new YandexGptException("Sorry, I couldn't generate a response at the moment.");
        }
    }

    private Map<String, Object> createOpenAiFormatRequest(List<ChatMessage> messages, String modelUri, int maxTokens) {
        Map<String, Object> request = new HashMap<>();

        request.put("model", modelUri);
        List<Map<String, String>> openAiMessages = messages.stream()
                .map(msg -> {
                    Map<String, String> openAiMsg = new HashMap<>();
                    openAiMsg.put("role", msg.getRole());
                    openAiMsg.put("content", msg.getContent());
                    return openAiMsg;
                })
                .toList();

        request.put("messages", openAiMessages);
        request.put("max_tokens", maxTokens);
        request.put("temperature", 0.6);

        return request;
    }

    @SneakyThrows
    @SuppressWarnings("unchecked")
    private String parseOpenAiFormatResponse(String responseBody) {
        Map<String, Object> response = objectMapper.readValue(responseBody, 
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));

        if (response.containsKey("error")) {
            Map<String, Object> error = (Map<String, Object>) response.get("error");
            String errorMessage = error.get("message") != null 
                    ? error.get("message").toString() 
                    : "Unknown error";
            throw new YandexGptException("Yandex AI Studio OpenAI-compatible API error: " + errorMessage);
        }

        if (response.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                Map<String, Object> message = (Map<String, Object>) choice.get("message");
                if (message.containsKey("content")) {
                    return message.get("content").toString();
                }
            }
        }

        throw new YandexGptException("No response from Yandex AI Studio OpenAI-compatible API");
    }
}
