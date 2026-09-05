package org.core.service.registration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.telegram.TelegramOutbox;
import org.core.domain.telegram.TelegramOutboxStatus;
import org.core.dto.registration.PendingRegistrationDTO;
import org.core.dto.user.*;
import org.core.event.ActionType;
import org.core.event.SubscriptionStatus;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.core.exception.exceptions.PrivacyConsentRequiredException;
import org.core.exception.exceptions.RegistrationNotAllowedException;
import org.core.exception.exceptions.UserAlreadyExistsException;
import org.core.repository.telegram.TelegramOutboxRepository;
import org.core.service.UserValidationService;
import org.core.service.crud.UserService;
import org.core.service.email.EmailService;
import org.core.util.EmailNormalizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class RegistrationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final EmailService emailService;
    private final UserService userService;
    private final UserValidationService validationService;
    private final EmailNormalizer emailNormalizer;
    private final RegistrationPendingService registrationPendingService;
    private final PasswordEncoder passwordEncoder;
    private final TelegramOutboxRepository telegramOutboxRepository;

    @Value("${app.registration.verification.ttl-minutes}")
    private int verificationTtlMinutes;

    @Value("${app.registration.verification.max-attempts}")
    private int maxVerificationAttempts;

    @Value("${app.registration.enabled}")
    private boolean registrationEnabled;

    @Value("${app.registration.invite-code}")
    private String expectedInviteCode;

    @Value("${app.privacy.consent.version}")
    private String privacyConsentVersion;

    public RegistrationMessageDTO requestRegistration(CreateUserDTO createDto, String clientIp) {
        validateRegistrationAllowed(createDto.getInviteCode());
        validatePrivacyConsent(createDto);

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
                .privacyAcceptedAt(LocalDateTime.now())
                .privacyConsentVersion(privacyConsentVersion)
                .privacyAcceptedIp(truncateIp(clientIp))
                .build();

        registrationPendingService.savePending(email, pendingDTO);
        emailService.sendVerificationCode(email, code);
        log.info("Registration verification code sent to {}", email);
        return new RegistrationMessageDTO("Код подтверждения отправлен на " + email);
    }

    public UserLoginResponseDTO verifyEmailAndRegister(VerifyEmailDTO verifyEmailDTO) {
        String email = emailNormalizer.normalizeEmail(verifyEmailDTO.getEmail());
        PendingRegistrationDTO pendingDTO = registrationPendingService.getPending(email);
        if (!passwordEncoder.matches(verifyEmailDTO.getCode(), pendingDTO.getCodeHash())) {
            pendingDTO.setFailedAttempts(pendingDTO.getFailedAttempts() + 1);
            if (pendingDTO.getFailedAttempts() >= maxVerificationAttempts) {
                registrationPendingService.deletePendingKey(email);
                throw new InvalidVerificationCodeException("Превышено число попыток. Запросите новый код.");
            }
            registrationPendingService.savePending(email, pendingDTO);
            throw new InvalidVerificationCodeException("Неверный код подтверждения");
        }

        if (validationService.checkUserInDBByEmail(email)) {
            registrationPendingService.deletePendingKey(email);
            throw new UserAlreadyExistsException("Пользователь с email " + email + " уже зарегистрирован");
        }
        registrationPendingService.deletePendingKey(email);

        telegramOutboxRepository.save(TelegramOutbox.builder()
                        .userName(pendingDTO.getName())
                        .subscriptionStatus(SubscriptionStatus.DEFAULT)
                        .actionType(ActionType.REGISTRATION)
                        .status(TelegramOutboxStatus.READY_TO_SEND)
                .build());

        return userService.createVerifiedUserAndLogin(
                pendingDTO.getName(),
                email,
                pendingDTO.getPasswordHash(),
                pendingDTO.getPrivacyAcceptedAt(),
                pendingDTO.getPrivacyConsentVersion(),
                pendingDTO.getPrivacyAcceptedIp()
        );
    }

    public RegistrationMessageDTO resendVerificationCode(String emailRaw) {
        String email = emailNormalizer.normalizeEmail(emailRaw);
        PendingRegistrationDTO pending = registrationPendingService.getPending(email);

        String code = generateVerificationCode();
        pending.setCodeHash(passwordEncoder.encode(code));
        pending.setFailedAttempts(0);
        registrationPendingService.savePending(email, pending);

        emailService.sendVerificationCode(email, code);
        log.info("Registration verification code resent to {}", email);
        return new RegistrationMessageDTO("Новый код отправлен на " + email);
    }

    public RegistrationConfigDTO getRegistrationConfig() {
        return new RegistrationConfigDTO(registrationEnabled, isInviteCodeRequired(), privacyConsentVersion);
    }

    private void validatePrivacyConsent(CreateUserDTO createDto) {
        if (!Boolean.TRUE.equals(createDto.getPrivacyAccepted())) {
            throw new PrivacyConsentRequiredException(
                    "Необходимо согласие на обработку персональных данных"
            );
        }
        if (createDto.getPrivacyConsentVersion() == null
                || !privacyConsentVersion.equals(createDto.getPrivacyConsentVersion().trim())) {
            throw new PrivacyConsentRequiredException(
                    "Устаревшая версия согласия. Обновите страницу и подтвердите согласие снова."
            );
        }
    }

    private String truncateIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return null;
        }
        String trimmed = clientIp.trim();
        return trimmed.length() <= 64 ? trimmed : trimmed.substring(0, 64);
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
