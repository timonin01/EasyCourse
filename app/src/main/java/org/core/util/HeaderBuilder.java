package org.core.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
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

    @Value("${stepik.token.aop.enabled}")
    private boolean aopEnabled;

    private final StepikTokenService stepikTokenService;
    private final UserContextBean userContextBean;

    public HttpHeaders createHeadersWithRedisAccessToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        Long userId = userContextBean.getUserId();
        if (userId == null) {
            throw new RuntimeException("User ID not found in UserContextBean. " +
                    "Ensure UserContextBean.setUserId() is called before this method.");
        }
        String accessToken = stepikTokenService.getAccessToken(userId);
        if (accessToken == null) {
            throw new RuntimeException("No valid access token available for user: " + userId);
        }
        headers.set("Authorization", "Bearer " + accessToken);
        return headers;
    }

    public HttpHeaders createHeadersWithStaticToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        if (staticToken == null || staticToken.trim().isEmpty()) {
            throw new RuntimeException("Static token not configured in properties");
        }
        
        headers.set("Authorization", "Bearer " + staticToken);
        return headers;
    }

    public HttpHeaders createHeaders(){
        if(aopEnabled) return createHeadersWithRedisAccessToken();
        return createHeadersWithStaticToken();
    }
}
