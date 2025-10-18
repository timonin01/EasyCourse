package org.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.dto.user.StepikOAuthConfigDTO;
import org.core.event.OAuthConfigChangedEvent;
import org.core.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepikOAuthService {

    @Value("${stepik.oauth.token-url:https://stepik.org/oauth2/token/}")
    private String tokenUrl;

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void updateStepikOAuthConfig(Long userId, StepikOAuthConfigDTO config) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setStepikClientId(config.getClientId());
        user.setStepikClientSecret(config.getClientSecret());

        userRepository.save(user);
        
        eventPublisher.publishEvent(new OAuthConfigChangedEvent(this, userId));
        log.info("OAuth configuration updated for user: {}", userId);
    }

    @Transactional(readOnly = true)
    public StepikOAuthConfigDTO getStepikOAuthConfig(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return StepikOAuthConfigDTO.builder()
                .clientId(user.getStepikClientId())
                .clientSecret(user.getStepikClientSecret())
                .build();
    }

    @Transactional
    public void clearStepikOAuthConfig(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setStepikClientId(null);
        user.setStepikClientSecret(null);
        user.setStepikAccessToken(null);

        userRepository.save(user);
        
        eventPublisher.publishEvent(new OAuthConfigChangedEvent(this, userId));
        log.info("OAuth configuration cleared for user: {}", userId);
    }

    @Transactional(readOnly = true)
    public boolean hasStepikOAuthConfig(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return user.getStepikClientId() != null && 
               user.getStepikClientSecret() != null;
    }

    public String getAccessTokenForUser(Long userId) {
        StepikOAuthConfigDTO config = getStepikOAuthConfig(userId);
        return getAccessToken(config.getClientId(), config.getClientSecret());
    }

    private String getAccessToken(String clientId, String clientSecret) {
        try {
            log.info("Requesting access token from Stepik OAuth2 for clientId: {}", clientId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                String accessToken = jsonNode.get("access_token").asText();
                
                log.info("Successfully obtained access token from Stepik OAuth2");
                return accessToken;
            } else {
                log.error("Failed to obtain access token. Status: {}, Body: {}", 
                         response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to obtain access token from Stepik OAuth2");
            }
        } catch (Exception e) {
            log.error("Error obtaining access token from Stepik OAuth2: {}", e.getMessage());
            throw new RuntimeException("Error obtaining access token from Stepik OAuth2: " + e.getMessage());
        }
    }
}
