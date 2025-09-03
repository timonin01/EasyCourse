package org.core.rest;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.service.DeepSeekService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/ai")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class AIController {

    private final DeepSeekService deepSeekService;

    @PostMapping("/chat")
    public String chat(@RequestBody String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        return deepSeekService.generateResponse(message);
    }

}
