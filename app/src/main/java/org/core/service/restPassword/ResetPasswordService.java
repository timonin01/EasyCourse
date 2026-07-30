package org.core.service.restPassword;

import lombok.RequiredArgsConstructor;
import org.core.domain.User;
import org.core.dto.resetPassword.PasswordResetTokenDTO;
import org.core.dto.resetPassword.PendingPasswordResetDTO;
import org.core.dto.resetPassword.ResetPasswordDTO;
import org.core.dto.resetPassword.ResetPasswordMessageDTO;
import org.core.dto.user.VerifyEmailDTO;
import org.core.exception.exceptions.InvalidVerificationCodeException;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.service.crud.UserService;
import org.core.service.email.EmailService;
import org.core.util.EmailNormalizer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ResetPasswordService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.registration.verification.max-attempts}")
    private int maxVerificationAttempts;

    private final UserService userService;
    private final ResetPasswordPendingService resetPasswordPendingService;
    private final PasswordResetTokenService passwordResetTokenService;
    private final EmailService emailService;
    private final EmailNormalizer emailNormalizer;
    private final PasswordEncoder passwordEncoder;

    public ResetPasswordMessageDTO requestResetPassword(String emailRaw) {
        String email = emailNormalizer.normalizeEmail(emailRaw);
        if (!userService.checkUserByEmail(email)) {
            return new ResetPasswordMessageDTO("Если аккаунт с таким email существует, мы отправили код подтверждения");
        }

        String code = generateVerificationCode();
        PendingPasswordResetDTO pendingPasswordResetDTO = PendingPasswordResetDTO.builder()
                .email(email)
                .codeHash(passwordEncoder.encode(code))
                .failedAttempts(0)
                .build();

        resetPasswordPendingService.savePending(email, pendingPasswordResetDTO);
        emailService.sendPasswordResetCode(email, code);
        return new ResetPasswordMessageDTO("Если аккаунт с таким email существует, мы отправили код подтверждения");
    }

    public PasswordResetTokenDTO verifyEmail(VerifyEmailDTO verifyEmailDTO) {
        String email = emailNormalizer.normalizeEmail(verifyEmailDTO.getEmail());
        PendingPasswordResetDTO pendingPasswordResetDTO = resetPasswordPendingService.getPending(email);

        if (!passwordEncoder.matches(verifyEmailDTO.getCode(), pendingPasswordResetDTO.getCodeHash())) {
            pendingPasswordResetDTO.setFailedAttempts(pendingPasswordResetDTO.getFailedAttempts() + 1);
            if (pendingPasswordResetDTO.getFailedAttempts() >= maxVerificationAttempts) {
                resetPasswordPendingService.deletePendingKey(email);
                throw new InvalidVerificationCodeException("Превышено число попыток. Запросите новый код.");
            }
            resetPasswordPendingService.savePending(email, pendingPasswordResetDTO);
            throw new InvalidVerificationCodeException("Неверный код подтверждения");
        }
        resetPasswordPendingService.deletePendingKey(email);

        String resetToken = UUID.randomUUID().toString();
        passwordResetTokenService.savePending(resetToken, email);
        return new PasswordResetTokenDTO(resetToken);
    }

    public ResetPasswordMessageDTO resetPassword(ResetPasswordDTO resetPasswordDTO) {
        String email = passwordResetTokenService.getPending(resetPasswordDTO.getResetToken());
        User user = userService.findUserByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Пользователь с таким email " + email + " не был найден"));

        userService.updatePassword(user.getId(), resetPasswordDTO.getNewPassword());
        passwordResetTokenService.deletePendingKey(resetPasswordDTO.getResetToken());
        return new ResetPasswordMessageDTO("Пароль успешно обновлен");
    }

    private String generateVerificationCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

}
