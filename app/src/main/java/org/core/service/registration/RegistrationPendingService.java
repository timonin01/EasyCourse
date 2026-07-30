package org.core.service.registration;

import lombok.RequiredArgsConstructor;
import org.core.dto.registration.PendingRegistrationDTO;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RegistrationPendingService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.registration.pending.prefix}")
    private String pendingPrefix;

    @Value("${app.registration.verification.ttl-minutes}")
    private int verificationTtlMinutes;

    public PendingRegistrationDTO getPending(String email) {
        Object value = redisTemplate.opsForValue().get(pendingKey(email));
        if (!(value instanceof PendingRegistrationDTO pending)) {
            throw new InvalidVerificationCodeException(
                    "Заявка на регистрацию не найдена или истекла. Начните регистрацию заново."
            );
        }
        return pending;
    }

    public void savePending(String email, PendingRegistrationDTO pending) {
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
