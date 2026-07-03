package org.core.service.registration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.user.CreateUserDTO;
import org.core.dto.user.RegistrationConfigDTO;
import org.core.dto.user.RegistrationMessageDTO;
import org.core.dto.user.UserLoginResponseDTO;
import org.core.dto.user.VerifyEmailDTO;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.core.exception.exceptions.RegistrationNotAllowedException;
import org.core.exception.exceptions.UserAlreadyExistsException;
import org.core.service.UserValidationService;
import org.core.service.crud.UserService;
import org.core.service.email.EmailService;
import org.core.util.EmailNormalizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
public class RegistrationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;
    private final UserService userService;
    private final UserValidationService validationService;
    private final EmailNormalizer emailNormalizer;
    private final PendingService pendingService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.registration.verification.ttl-minutes}")
    private int verificationTtlMinutes;

    @Value("${app.registration.verification.max-attempts}")
    private int maxVerificationAttempts;

    @Value("${app.registration.enabled}")
    private boolean registrationEnabled;

    @Value("${app.registration.invite-code}")
    private String expectedInviteCode;

    public RegistrationMessageDTO requestRegistration(CreateUserDTO createDto) {
        validateRegistrationAllowed(createDto.getInviteCode());
        String email = emailNormalizer.normalizeEmail(createDto.getEmail());
        if (validationService.checkUserInDBByEmail(email)) {
            throw new UserAlreadyExistsException("Пользователь с email " + email + " уже зарегистрирован");
        }

        String code = generateVerificationCode();
        PendingRegistrationDTO pendingDTO = PendingRegistrationDTO.builder()
                .name(createDto.getName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(createDto.getPassword()))
                .codeHash(passwordEncoder.encode(code))
                .failedAttempts(0)
                .build();

        pendingService.savePending(email, pendingDTO);
        emailService.sendVerificationCode(email, code);
        log.info("Registration verification code sent to {}", email);
        return new RegistrationMessageDTO("Код подтверждения отправлен на " + email);
    }

    public UserLoginResponseDTO verifyEmailAndRegister(VerifyEmailDTO verifyDto) {
        String email = emailNormalizer.normalizeEmail(verifyDto.getEmail());
        PendingRegistrationDTO pendingDTO = pendingService.getPending(email);
        if (!passwordEncoder.matches(verifyDto.getCode(), pendingDTO.getCodeHash())) {
            pendingDTO.setFailedAttempts(pendingDTO.getFailedAttempts() + 1);
            if (pendingDTO.getFailedAttempts() >= maxVerificationAttempts) {
                redisTemplate.delete(pendingService.pendingKey(email));
                throw new InvalidVerificationCodeException("Превышено число попыток. Запросите новый код.");
            }
            pendingService.savePending(email, pendingDTO);
            throw new InvalidVerificationCodeException("Неверный код подтверждения");
        }

        if (validationService.checkUserInDBByEmail(email)) {
            redisTemplate.delete(pendingService.pendingKey(email));
            throw new UserAlreadyExistsException("Пользователь с email " + email + " уже зарегистрирован");
        }
        redisTemplate.delete(pendingService.pendingKey(email));
        return userService.createVerifiedUserAndLogin(pendingDTO.getName(), email, pendingDTO.getPasswordHash());
    }

    public RegistrationMessageDTO resendVerificationCode(String emailRaw) {
        String email = emailNormalizer.normalizeEmail(emailRaw);
        PendingRegistrationDTO pending = pendingService.getPending(email);

        String code = generateVerificationCode();
        pending.setCodeHash(passwordEncoder.encode(code));
        pending.setFailedAttempts(0);
        pendingService.savePending(email, pending);

        emailService.sendVerificationCode(email, code);
        log.info("Registration verification code resent to {}", email);
        return new RegistrationMessageDTO("Новый код отправлен на " + email);
    }

    public RegistrationConfigDTO getRegistrationConfig() {
        return new RegistrationConfigDTO(registrationEnabled, isInviteCodeRequired());
    }

    private String generateVerificationCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private boolean isInviteCodeRequired() {
        if (expectedInviteCode == null || expectedInviteCode.isBlank()) {
            return false;
        }
        String normalized = expectedInviteCode.trim().toLowerCase();
        return !normalized.equals("пропуск") && !normalized.equals("skip") && !normalized.equals("-");
    }

    private void validateRegistrationAllowed(String inviteCode) {
        if (!registrationEnabled) {
            throw new RegistrationNotAllowedException("Регистрация временно закрыта");
        }
        if (!isInviteCodeRequired()) {
            return;
        }
        if (inviteCode == null || !expectedInviteCode.trim().equals(inviteCode.trim())) {
            throw new RegistrationNotAllowedException("Неверный код приглашения");
        }
    }
}
