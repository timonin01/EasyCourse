package org.core.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.User;
import org.core.event.OAuthConfigChangedEvent;
import org.core.repository.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikTokenService {

    private final UserRepository userRepository;
    private final StepikOAuthService stepikOAuthService;
    private final RedisTokenCacheService redisTokenCacheService;

    @Transactional
    public void updateAccessToken(Long userId, String accessToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setStepikAccessToken(accessToken);
        userRepository.save(user);
        
        redisTokenCacheService.cacheToken(userId, accessToken);
        log.info("Access token updated and cached in Redis for user: {}", userId);
    }

    @Transactional(readOnly = true)
    public String getAccessToken(Long userId) {
        String cachedToken = redisTokenCacheService.getValidToken(userId);
        if (cachedToken != null) {
            log.debug("Using cached token from Redis for user: {}", userId);
            return cachedToken;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        String dbToken = user.getStepikAccessToken();
        if (dbToken != null && !dbToken.trim().isEmpty()) {
            redisTokenCacheService.cacheToken(userId, dbToken);
            log.debug("Token loaded from database and cached in Redis for user: {}", userId);
            return dbToken;
        }

        if (stepikOAuthService.hasStepikOAuthConfig(userId)) {
            try {
                String newToken = stepikOAuthService.getAccessTokenForUser(userId);
                updateAccessToken(userId, newToken);
                log.info("New token obtained via OAuth2 and cached in Redis for user: {}", userId);
                return newToken;
            } catch (Exception e) {
                log.error("Failed to obtain new token via OAuth2 for user {}: {}", userId, e.getMessage());
                throw new RuntimeException("Failed to obtain access token: " + e.getMessage());
            }
        }
        return null;
    }

    @Transactional
    public void clearAccessToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setStepikAccessToken(null);
        userRepository.save(user);
        
        redisTokenCacheService.evictToken(userId);
        log.info("Access token cleared from database and Redis cache for user: {}", userId);
    }

    @EventListener
    public void handleOAuthConfigChanged(OAuthConfigChangedEvent event) {
        clearTokenCacheForUser(event.getUserId());
    }

    public void clearTokenCacheForUser(Long userId) {
        redisTokenCacheService.evictToken(userId);
        log.info("Token cache cleared for user: {} due to OAuth config change", userId);
    }
}

