package org.core.service.ai.yandex;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.ai.yandexgpt.Message;
import org.core.dto.ai.yandexgpt.YandexGptRequest;
import org.core.dto.ai.yandexgpt.YandexGptResponse;
import org.core.exception.exceptions.YandexGptException;
import org.core.service.AiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class YandexGptService implements AiService {

    @Value("${yandex.gpt.api.key}")
    private String apiKey;

    @Value("${yandex.gpt.api.url}")
    private String url;

    @Value("${yandex.gpt.api.folder-id:}")
    private String folderId;

    @Value("${yandex.gpt.api.model-uri}")
    private String modelUri;

    @Value("${max.tokens.default}")
    private Integer maxTokensDefault;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final YandexAiStudioService yandexAiStudioService;

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt){
        return generateResponse(messages, hasSystemPrompt, maxTokensDefault);
    }

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens){
        return generateResponse(messages, hasSystemPrompt, maxTokens, modelUri);
    }

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, String modelUri){
        return generateResponse(messages, hasSystemPrompt, maxTokensDefault, modelUri, false);
    }

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens, String customModelUri){
        return generateResponse(messages, hasSystemPrompt, maxTokens, customModelUri, false);
    }

    @SneakyThrows
    public String generateResponse(List<ChatMessage> messages, boolean hasSystemPrompt, int maxTokens, String customModelUri, boolean jsonObject){
        if (messages == null || messages.isEmpty()) {
            throw new YandexGptException("Messages cannot be empty");
        }

        String uriToUse = customModelUri != null && !customModelUri.isBlank() ? customModelUri : modelUri;
        if (YandexAiStudioService.requiresAiStudioApi(uriToUse)) {
            return yandexAiStudioService.generateResponse(messages, maxTokens, uriToUse);
        }

        try {
            return callYandexCompletion(messages, hasSystemPrompt, maxTokens, uriToUse, jsonObject);
        } catch (RuntimeException e) {
            if (jsonObject && shouldRetryWithoutJsonMode(e)) {
                log.warn("Yandex GPT json_object mode rejected for model {}, retrying without json format", uriToUse);
                return callYandexCompletion(messages, hasSystemPrompt, maxTokens, uriToUse, false);
            }
            log.error("Error calling Yandex GPT API: {}", e.getMessage());
            throw new YandexGptException("Sorry, I couldn't generate a response at the moment.");
        }
    }

    @SneakyThrows
    private String callYandexCompletion(List<ChatMessage> messages,
                                        boolean hasSystemPrompt,
                                        int maxTokens,
                                        String uriToUse,
                                        boolean jsonObject) {
        List<Message> yandexMessages = messages.stream()
                .map(chatMessage -> new Message(chatMessage.getRole(), chatMessage.getContent()))
                .toList();
        YandexGptRequest yandexGptRequest = new YandexGptRequest(uriToUse, yandexMessages, jsonObject);
        yandexGptRequest.setMaxTokens(maxTokens);
        log.info("Sending request to Yandex GPT (model: {}, jsonObject: {}): {}",
                uriToUse, jsonObject, objectMapper.writeValueAsString(yandexGptRequest));

        HttpEntity<YandexGptRequest> entity = new HttpEntity<>(yandexGptRequest, createHeaders());
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            log.info("Response from Yandex GPT: {}", response.getBody());
            YandexGptResponse yandexGptResponse = objectMapper.readValue(response.getBody(), YandexGptResponse.class);
            if (yandexGptResponse.getError() != null) {
                throw new YandexGptException("Yandex GPT error: " + yandexGptResponse.getError().getMessage());
            }
            if (yandexGptResponse.getResult() != null &&
                    yandexGptResponse.getResult().getAlternatives() != null &&
                    !yandexGptResponse.getResult().getAlternatives().isEmpty()) {
                return yandexGptResponse.getResult().getAlternatives().get(0).getMessage().getText();
            }
            throw new YandexGptException("No response from Yandex GPT");
        }
        throw new YandexGptException("No response from Yandex GPT");
    }

    private boolean shouldRetryWithoutJsonMode(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            String message = current.getMessage();
            if (message == null) {
                continue;
            }
            String lower = message.toLowerCase();
            if (lower.contains("400")
                    || lower.contains("bad request")
                    || lower.contains("response_format")
                    || lower.contains("json_object")
                    || lower.contains("json format")
                    || lower.contains("not support")) {
                return true;
            }
        }
        return false;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Api-Key " + apiKey);
        if (folderId != null && !folderId.isBlank()) {
            headers.set("x-folder-id", folderId);
        }
        return headers;
    }
}
