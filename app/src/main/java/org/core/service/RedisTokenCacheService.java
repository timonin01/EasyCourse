package org.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisTokenCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final long TOKEN_TTL_HOURS = 4;
    private static final String TOKEN_PREFIX = "stepik:token:";
    private static final String TIMESTAMP_PREFIX = "stepik:timestamp:";

    public void cacheToken(Long userId, String token) {
        String tokenKey = TOKEN_PREFIX + userId;
        String timestampKey = TIMESTAMP_PREFIX + userId;
        try {
            redisTemplate.opsForValue().set(tokenKey, token, Duration.ofHours(TOKEN_TTL_HOURS));
            
            redisTemplate.opsForValue().set(timestampKey, LocalDateTime.now().toString(), Duration.ofHours(TOKEN_TTL_HOURS));
            log.info("Token cached in Redis for user: {} with TTL: {} hours", userId, TOKEN_TTL_HOURS);
        } catch (Exception e) {
            log.error("Failed to cache token in Redis for user {}: {}", userId, e.getMessage());
        }
    }

    public String getCachedToken(Long userId) {
        String tokenKey = TOKEN_PREFIX + userId;
        
        try {
            Object token = redisTemplate.opsForValue().get(tokenKey);
            if (token != null) {
                log.debug("Token found in Redis cache for user: {}", userId);
                return token.toString();
            }
            log.debug("Token not found in Redis cache for user: {}", userId);
            return null;
        } catch (Exception e) {
            log.error("Failed to get token from Redis for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    public void evictToken(Long userId) {
        String tokenKey = TOKEN_PREFIX + userId;
        String timestampKey = TIMESTAMP_PREFIX + userId;
        
        try {
            redisTemplate.delete(tokenKey);
            redisTemplate.delete(timestampKey);
            log.info("Token evicted from Redis cache for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to evict token from Redis for user {}: {}", userId, e.getMessage());
        }
    }

    public String getValidToken(Long userId) {
        if (isTokenValid(userId)) {
            return getCachedToken(userId);
        }
        return null;
    }

    public boolean isTokenValid(Long userId) {
        String tokenKey = TOKEN_PREFIX + userId;
        String timestampKey = TIMESTAMP_PREFIX + userId;
        
        try {
            if (!redisTemplate.hasKey(tokenKey) || redisTemplate.opsForValue().get(timestampKey) == null) {
                return false;
            }
            Object timestampStr = redisTemplate.opsForValue().get(timestampKey);

            LocalDateTime tokenTime = LocalDateTime.parse(timestampStr.toString());
            long hoursSinceCreation = ChronoUnit.HOURS.between(tokenTime, LocalDateTime.now());
            
            if (!(hoursSinceCreation < TOKEN_TTL_HOURS)) {
                log.info("Token expired for user: {} (age: {} hours), will be refreshed on next request", userId, hoursSinceCreation);
                evictToken(userId);
                return false;
            }
            
            return true;
        } catch (Exception e) {
            log.error("Failed to check token validity in Redis for user {}: {}", userId, e.getMessage());
            return false;
        }
    }
}
