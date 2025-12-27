package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.email.EmailRequest;
import org.core.exception.exceptions.EmailSendException;
import org.core.dto.email.EmailCodeResponse;
import org.core.service.email.EmailService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/api/v1/send")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class EmailSenderController {

    private final EmailService emailService;

    @PostMapping
    public EmailCodeResponse sendEmail(@Valid @RequestBody EmailRequest emailRequest){
        String code = emailService.sendAlert(emailRequest);
        if (code != null) {
            return new EmailCodeResponse(code);
        } else {
            throw new EmailSendException("Failed to send email");
        }
    }
}
