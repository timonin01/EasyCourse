package org.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.deepseek.DeepSeekRequest;
import org.core.dto.deepseek.DeepSeekResponse;
import org.core.exception.DeepSeekException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class DeepSeekService {

    @Value("${deepseek.api.key}")
    private String apiKey;

    @Value("${deepseek.api.url}")
    private String url;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String generateResponse(String prompt) {
        try {
            DeepSeekRequest request = new DeepSeekRequest(prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("Authorization", "Bearer " + apiKey);

            HttpEntity<DeepSeekRequest> entity = new HttpEntity<>(request, headers);
            ResponseEntity<DeepSeekResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    DeepSeekResponse.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody().getChoices().get(0).getText();
            }

        } catch (Exception e) {
            log.error("Error calling DeepSeek API: {}", e.getMessage());
            throw new DeepSeekException("Sorry, I couldn't generate a response at the moment.");
        }
        return "Sorry, I couldn't generate a response at the moment.";
    }

}
