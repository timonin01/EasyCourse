package org.core.service.email;

import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.exception.exceptions.EmailSendException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class EmailService {

    private final JavaMailSender mailSender;
    private final MessageTemplateService messageTemplateService;

    @Value("${app.mail.from}")
    private String mailFrom;

    @Value("${app.mail.from-name}")
    private String mailFromName;

    public void sendVerificationCode(String email, String code) {
        sendHtmlEmail(email, "Подтверждение регистрации EasyCourse",
                messageTemplateService.createEmailVerificationMessageHtml(code),
                "Verification email sent to: {}", "Failed to send verification email to {}: {}"
        );
    }

    public void sendPasswordResetCode(String email, String code) {
        sendHtmlEmail(email, "Сброс пароля EasyCourse",
                messageTemplateService.createPasswordResetMessageHtml(code),
                "Password reset email sent to: {}", "Failed to send password reset email to {}: {}"
        );
    }

    private void sendHtmlEmail(String email, String subject, String htmlContent, String successLog, String errorLog) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(mailFrom, mailFromName);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info(successLog, email);
        } catch (Exception e) {
            log.error(errorLog, email, e.getMessage());
            throw new EmailSendException("Не удалось отправить письмо с кодом подтверждения");
        }
    }
}
