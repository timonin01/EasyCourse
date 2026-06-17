package org.core.service.ai.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiMessageHelper {

    @Value("${ai.message.tittle.max.length:255}")
    private int titleMaxLength;

    private final ObjectMapper objectMapper;

    @Nullable
    public String serializePayload(@Nullable StepikBlockRequest payload) {
        if (payload == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize generated step payload", e);
        }
    }

    @Nullable
    public StepikBlockRequest deserializePayload(@Nullable String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(payloadJson, StepikBlockRequest.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize generated step payload, skipping: {}", e.getMessage());
            return null;
        }
    }

    @Nullable
    public String truncateTitle(@Nullable String content) {
        if (content == null) {
            return null;
        }
        String trimmed = content.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() <= titleMaxLength) {
            return trimmed;
        }
        return trimmed.substring(0, titleMaxLength - 3) + "...";
    }
}
