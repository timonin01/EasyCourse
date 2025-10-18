package org.core.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.service.StepikTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class HeaderBuilder {

    @Value("${stepik.api.token}")
    private String staticToken;

    private final StepikTokenService stepikTokenService;

    public HttpHeaders createHeaders(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        String accessToken = stepikTokenService.getAccessToken(userId);
        if (accessToken == null) {
            throw new RuntimeException("No valid access token available for user: " + userId);
        }
        
        headers.set("Authorization", "Bearer " + accessToken);
        return headers;
    }
    public HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        if (staticToken == null || staticToken.trim().isEmpty()) {
            throw new RuntimeException("Static token not configured in properties");
        }
        
        headers.set("Authorization", "Bearer " + staticToken);
        return headers;
    }
}
