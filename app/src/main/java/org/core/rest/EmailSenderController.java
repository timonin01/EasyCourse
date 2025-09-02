package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.EmailRequest;
import org.core.exception.EmailSendException;
import org.core.service.email.EmailService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/v1/send")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class EmailSenderController {

    private final EmailService emailService;

    @PostMapping
    public String sendEmail(@Valid @RequestBody EmailRequest emailRequest){
        if (emailService.sendAlert(emailRequest)) {
            return "Email sent successfully to: " + emailRequest.getEmail();
        } else {
            throw new EmailSendException("Failed to send email");
        }
    }
}
