package org.core.service.email;

import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.EmailRequest;
import org.core.exception.EmailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class EmailService {

    private final JavaMailSender mailSender;
    private final MessageTemplateService messageTemplateService;

    public boolean sendAlert(EmailRequest emailRequest) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("systemalert34@gmail.com", "Alert System");
            helper.setTo(emailRequest.getEmail());
            helper.setSubject("Verify your email address");

            String htmlContent = messageTemplateService.createEmailVerificationMessageHtml(emailRequest.getCode());
            helper.setText(htmlContent, true);

//            String textContent = messageTemplateService.createEmailVerificationMessage(emailRequest.getCode());
//            helper.setText(textContent, false);

            mailSender.send(mimeMessage);

            log.info("Email sent successfully to: {}", emailRequest.getEmail());
            return true;

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", emailRequest.getEmail(), e.getMessage());
            throw new EmailSendException("Failed to send email");
        }
    }
}