package org.core.service.email;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class MessageTemplateService {

    private final String emailVerificationTemplate;

    public MessageTemplateService() throws IOException {
        ClassPathResource resource = new ClassPathResource("email-verification.html");
        this.emailVerificationTemplate = StreamUtils.copyToString(
            resource.getInputStream(), 
            StandardCharsets.UTF_8
        );
    }

    public String createEmailVerificationMessage(String code) {
        return String.format("""
            Verify your email address
            
            You need to verify your email address to continue using your account. Enter the following code to verify your email address:
            
            %s
            
            If you did not request this email, please ignore it.
            
            Thanks,
            Support Team
            """, code);
    }

    public String createEmailVerificationMessageHtml(String code) {
        return emailVerificationTemplate.replace("{{code}}", code);
    }
}