package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.ai.GeneratedStepHistoryDTO;
import org.core.exception.exceptions.UserNotFoundException;
import org.core.service.ai.AiSessionMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agent/generated-steps")
@RequiredArgsConstructor
@Slf4j
public class GeneratedStepController {

    private final AiSessionMessageService aiSessionMessageService;
    private final UserContextBean userContextBean;

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        Long userId = userContextBean.getUserId();
        try {
            log.info("Loading generated steps history for userId={}", userId);
            List<GeneratedStepHistoryDTO> history = aiSessionMessageService.getGeneratedStepsHistory(userId)
                    .stream()
                    .filter(entry -> entry.getGeneratedStep() != null)
                    .toList();
            log.info("Loaded {} generated steps for userId={}", history.size(), userId);
            return ResponseEntity.ok(history);
        } catch (UserNotFoundException e) {
            log.error("User not found for generated steps history userId={}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to load generated steps history for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при загрузке истории сгенерированных шагов");
        }
    }
}
