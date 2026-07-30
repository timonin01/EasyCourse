package org.core.service.restPassword;

import lombok.RequiredArgsConstructor;
import org.core.dto.resetPassword.PendingPasswordResetDTO;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class ResetPasswordPendingService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.reset.password.pending.prefix}")
    private String pendingPrefix;

    @Value("${app.reset.password.verification.ttl-minutes}")
    private int verificationTtlMinutes;

    public PendingPasswordResetDTO getPending(String email) {
        Object value = redisTemplate.opsForValue().get(pendingKey(email));
        if (!(value instanceof PendingPasswordResetDTO pending)) {
            throw new InvalidVerificationCodeException(
                    "Заявка на смену пароля не найдена или истекла. Запросите код снова."
            );
        }
        return pending;
    }

    public void savePending(String email, PendingPasswordResetDTO pending) {
        redisTemplate.opsForValue().set(
                pendingKey(email),
                pending,
                Duration.ofMinutes(verificationTtlMinutes)
        );
    }

    public void deletePendingKey(String email){
        redisTemplate.delete(pendingKey(email));
    }

    private String pendingKey(String email) {
        return pendingPrefix + email;
    }

}
