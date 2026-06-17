package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.ai.ChatType;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.service.agent.AgentService;
import org.core.service.ai.AiSessionMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/agent/sessions")
@RequiredArgsConstructor
@Slf4j
public class AiSessionController {

    private final AiSessionMessageService aiSessionMessageService;

    private final AgentService agentService;

    @GetMapping("/latest")
    public ResponseEntity<?> getLatestSession(
            @RequestHeader("User-Id") Long userId,
            @RequestParam String chatType,
            @RequestParam(required = false) String stepType) {
        try {
            ChatType type = ChatType.valueOf(chatType.trim().toUpperCase());
            String sessionId = aiSessionMessageService
                    .getLatestSessionId(userId, type, stepType)
                    .orElse(null);
            log.info("Latest session for userId={}, chatType={}, stepType={}: {}", userId, chatType, stepType, sessionId);
            return ResponseEntity.ok(Collections.singletonMap("sessionId", sessionId));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid chatType in latest session request for userId={}: {}", userId, chatType);
            return ResponseEntity.badRequest().body("Invalid chatType");
        } catch (Exception e) {
            log.error("Failed to resolve latest session for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при получении последней сессии");
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(
            @RequestHeader("User-Id") Long userId,
            @RequestParam String sessionId) {
        try {
            log.info("Loading AI session history for userId={}, sessionId={}", userId, sessionId);
            if (sessionId == null || sessionId.isBlank()) {
                log.error("Empty sessionId in history request for userId={}", userId);
                return ResponseEntity.badRequest().body("SessionId is required");
            }
            List<AiMessageHistoryDTO> history = aiSessionMessageService.getSessionHistory(userId, sessionId.trim());

            log.info("Loaded {} messages for userId={}, sessionId={}", history.size(), userId, sessionId);
            return ResponseEntity.ok(history);
        } catch (IllegalArgumentException e) {
            log.error("Forbidden history access for userId={}, sessionId={}: {}", userId, sessionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (UserNotFoundException e) {
            log.error("User not found for history request userId={}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to load history for userId={}, sessionId={}: {}", userId, sessionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при загрузке истории сессии");
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> clearSession(
            @RequestHeader("User-Id") Long userId,
            @PathVariable String sessionId) {
        try {
            log.info("Clearing AI session for userId={}, sessionId={}", userId, sessionId);
            if (sessionId == null || sessionId.isBlank()) {
                log.warn("Empty sessionId in clear request for userId={}", userId);
                return ResponseEntity.badRequest().body("SessionId is required");
            }

            agentService.clearSession(userId, sessionId.trim());
            log.info("Cleared AI session for userId={}, sessionId={}", userId, sessionId);
            return ResponseEntity.ok("Сессия очищена");
        } catch (IllegalArgumentException e) {
            log.warn("Forbidden clear session for userId={}, sessionId={}: {}", userId, sessionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to clear session for userId={}, sessionId={}: {}", userId, sessionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при очистке сессии");
        }
    }
}
