package org.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.yandexgpt.YandexGptRequest;
import org.core.dto.yandexgpt.YandexGptResponse;
import org.core.exception.YandexGptException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Service
@Slf4j
@RequiredArgsConstructor
public class YandexGptService {

    @Value("${yandex.gpt.api.key}")
    private String apiKey;

    @Value("${yandex.gpt.api.url}")
    private String url;

    @Value("${yandex.gpt.api.model-uri}")
    private String modelUri;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateResponse(String prompt) {
        if (prompt == null || prompt.trim().isEmpty()) {
            throw new YandexGptException("Prompt cannot be empty");
        }
        try {
            YandexGptRequest request = new YandexGptRequest(modelUri, prompt.trim());
            log.info("Sending request to Yandex GPT: {}", objectMapper.writeValueAsString(request));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Authorization", "Api-Key " + apiKey);
            headers.set("x-folder-id", "b1grl0e87ma0oc0sae8c");

            HttpEntity<YandexGptRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Response from Yandex GPT: {}", response.getBody());
                YandexGptResponse gptResponse = objectMapper.readValue(response.getBody(), YandexGptResponse.class);
                if (gptResponse.getError() != null) {
                    throw new YandexGptException("Yandex GPT error: " + gptResponse.getError().getMessage());
                }
                if (gptResponse.getResult() != null && 
                    gptResponse.getResult().getAlternatives() != null && 
                    !gptResponse.getResult().getAlternatives().isEmpty()) {
                    return gptResponse.getResult().getAlternatives().get(0).getMessage().getText();
                }
                throw new YandexGptException("No response from Yandex GPT");
            }

        } catch (Exception e) {
            log.error("Error calling Yandex GPT API: {}", e.getMessage());
            throw new YandexGptException("Sorry, I couldn't generate a response at the moment.");
        }
        return "Sorry, I couldn't generate a response at the moment.";
    }
}
