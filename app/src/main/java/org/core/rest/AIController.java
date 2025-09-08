package org.core.rest;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import org.core.dto.AiRequest;
import org.core.service.ai.DeepSeekService;
import org.core.service.ai.YandexGptService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/ai")
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class AIController {

    private final DeepSeekService deepSeekService;
    private final YandexGptService yandexGptService;;

    @PostMapping("/chat")
    public String chat(@Valid @RequestBody AiRequest aiRequest) {
        String message = aiRequest.getMessage();
        if(aiRequest.getAiName().equals("DeepSeek")) {
            return deepSeekService.generateResponse(message);
        }
        return yandexGptService.generateResponse(message);
    }
}
