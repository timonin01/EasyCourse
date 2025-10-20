package org.core.service.email;

import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.email.EmailRequest;
import org.core.exception.EmailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class EmailService {

    private static final Random random = new Random();

    private final JavaMailSender mailSender;
    private final MessageTemplateService messageTemplateService;

    public String sendAlert(EmailRequest emailRequest) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("systemalert34@gmail.com", "Alert System");
            helper.setTo(emailRequest.getEmail());
            helper.setSubject("Verify your email address");

            int code = generateCode();

            String htmlContent = messageTemplateService.createEmailVerificationMessageHtml(String.valueOf(code));
            helper.setText(htmlContent, true);

//            String textContent = messageTemplateService.createEmailVerificationMessage(emailRequest.getCode());
//            helper.setText(textContent, false);

            mailSender.send(mimeMessage);

            log.info("Email sent successfully to: {}", emailRequest.getEmail());
            return String.valueOf(code);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", emailRequest.getEmail(), e.getMessage());
            throw new EmailSendException("Failed to send email");
        }
    }

    private int generateCode(){
        return random.nextInt(1000, 10000);
    }
}