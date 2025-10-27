package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
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
    
    @PostMapping("/start")
    public ResponseEntity<String> startSession(
            @RequestParam(required = false) String sessionId,
            @RequestParam(required = false) String systemPrompt) {
        
        try {
            if (sessionId == null || sessionId.trim().isEmpty()) {
                sessionId = "session_" + UUID.randomUUID().toString().substring(0, 8);
            }
            
            String response = agentService.startSession(sessionId, systemPrompt);
            return ResponseEntity.ok(response + " Session ID: " + sessionId);
        } catch (Exception e) {
            log.error("Error starting session: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Ошибка при создании сессии");
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
    
    @PostMapping("/start-step")
    public ResponseEntity<String> startSessionForStepType(
            @RequestParam(required = false) String sessionId,
            @RequestParam String stepType,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty) {
        
        try {
            if (sessionId == null || sessionId.trim().isEmpty()) {
                sessionId = "session_" + UUID.randomUUID().toString().substring(0, 8);
            }
            
            Map<String, String> variables = new HashMap<>();
            if (topic != null) variables.put("topic", topic);
            if (difficulty != null) variables.put("difficulty", difficulty);
            
            String response = agentService.startSessionForStepType(sessionId, stepType, variables);
            return ResponseEntity.ok("Session ID: " + sessionId + "\nStep Type: " + stepType + "\n\nAI Response: " + response);
        } catch (Exception e) {
            log.error("Error starting session for step type: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Ошибка при создании сессии для типа шага");
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
            log.error("Error generating step: {}", e.getMessage());
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
