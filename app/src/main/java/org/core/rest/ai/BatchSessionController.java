package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.ai.BatchGenerationHistoryDTO;
import org.core.service.ai.BatchSessionMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/agent/batch")
@RequiredArgsConstructor
@Slf4j
public class BatchSessionController {

    private final BatchSessionMessageService batchSessionMessageService;

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestHeader("User-Id") Long userId) {
        try {
            log.info("Loading batch generation history for userId={}", userId);
            List<BatchGenerationHistoryDTO> history = batchSessionMessageService.getHistory(userId);
            log.info("Loaded {} batch generations for userId={}", history.size(), userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Failed to load batch history for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при загрузке истории batch-генераций");
        }
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearAllBatchGenerations(@RequestHeader("User-Id") Long userId) {
        try {
            log.info("Clearing all batch generations for userId={}", userId);
            batchSessionMessageService.clearAllBatchGenerations(userId);
            log.info("Cleared all batch generations for userId={}", userId);
            return ResponseEntity.ok("История batch-генераций очищена");
        } catch (Exception e) {
            log.error("Failed to clear all batch generations for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при очистке истории batch-генераций");
        }
    }
}
