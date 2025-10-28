package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.AgentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.core.dto.stepik.step.StepikBlockRequest;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@Slf4j
public class AgentController {
    
    private final AgentService agentService;
    
    @PostMapping("/chat")
    public ResponseEntity<String> chat(
            @RequestParam String sessionId,
            @RequestBody String userInput) {
        
        try {
            String response = agentService.handleUserMessage(sessionId, userInput);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in chat endpoint: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Ошибка при обработке запроса");
        }
    }
    
    @GetMapping("/history/{sessionId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable String sessionId) {
        try {
            List<ChatMessage> history = agentService.getSessionHistory(sessionId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error getting history for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate-step")
    public ResponseEntity<StepikBlockRequest> generateStep(
            @RequestParam String sessionId,
            @RequestParam String stepType,
            @RequestBody String userInput) {

        try {
            StepikBlockRequest stepikRequest = agentService.generateStep(sessionId, userInput, stepType);
            log.info("Generated step of type {} for session {}", stepType, sessionId);
            return ResponseEntity.ok(stepikRequest);
        } catch (Exception e) {
            log.error("Error in generateStep endpoint: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<String> clearSession(@PathVariable String sessionId) {
        try {
            agentService.clearSession(sessionId);
            return ResponseEntity.ok("Сессия очищена");
        } catch (Exception e) {
            log.error("Error clearing session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.internalServerError().body("Ошибка при очистке сессии");
        }
    }
}
