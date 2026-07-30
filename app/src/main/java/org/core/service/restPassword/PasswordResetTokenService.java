package org.core.service.restPassword;

import lombok.RequiredArgsConstructor;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class PasswordResetTokenService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.reset.token.pending.prefix}")
    private String pendingPrefix;

    @Value("${app.reset.password.verification.ttl-minutes}")
    private int verificationTtlMinutes;

    public String getPending(String resetToken) {
        Object value = redisTemplate.opsForValue().get(pendingKey(resetToken));
        if (!(value instanceof String email)) {
            throw new InvalidVerificationCodeException(
                    "Ссылка сброса пароля недействительна или истекла. Запросите код снова."
            );
        }
        return email;
    }

    public void savePending(String resetToken, String email) {
        redisTemplate.opsForValue().set(
                pendingKey(resetToken),
                email,
                Duration.ofMinutes(verificationTtlMinutes)
        );
    }

    public void deletePendingKey(String resetToken){
        redisTemplate.delete(pendingKey(resetToken));
    }

    private String pendingKey(String email) {
        return pendingPrefix + email;
    }

}
