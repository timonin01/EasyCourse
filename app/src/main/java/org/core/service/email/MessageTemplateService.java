package org.core.service.email;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class MessageTemplateService {

    private final String emailVerificationTemplate;
    private final String passwordResetTemplate;

    public MessageTemplateService() throws IOException {
        this.emailVerificationTemplate = loadTemplate("email-verification.html");
        this.passwordResetTemplate = loadTemplate("email-password-reset.html");
    }

    public String createEmailVerificationMessageHtml(String code) {
        return emailVerificationTemplate.replace("{{code}}", code);
    }

    public String createPasswordResetMessageHtml(String code) {
        return passwordResetTemplate.replace("{{code}}", code);
    }

    private static String loadTemplate(String classpathLocation) throws IOException {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    }
}
