package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.ai.BatchGenerationHistoryDTO;
import org.core.service.ai.BatchSessionMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @DeleteMapping("/{batchGenerationId}")
    public ResponseEntity<?> clearBatchGeneration(
            @RequestHeader("User-Id") Long userId,
            @PathVariable Long batchGenerationId) {
        try {
            log.info("Clearing batch generation for userId={}, batchGenerationId={}", userId, batchGenerationId);
            batchSessionMessageService.clearBatchGeneration(userId, batchGenerationId);
            log.info("Cleared batch generation for userId={}, batchGenerationId={}", userId, batchGenerationId);
            return ResponseEntity.ok("Batch-генерация удалена");
        } catch (IllegalArgumentException e) {
            log.warn("Forbidden batch clear for userId={}, batchGenerationId={}: {}", userId, batchGenerationId, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Failed to clear batch generation for userId={}, batchGenerationId={}: {}", userId, batchGenerationId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при удалении batch-генерации");
        }
    }
}
