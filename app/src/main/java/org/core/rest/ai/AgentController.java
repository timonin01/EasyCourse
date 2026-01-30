package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.AgentService;
import org.core.service.agent.batch.BatchAnalyzerService;
import org.core.service.agent.batch.BatchGeneratorService;
import org.core.service.agent.StepikRequestParser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agent")
@RequiredArgsConstructor
@Slf4j
public class AgentController {

    private final AgentService agentService;
    private final StepikRequestParser stepikRequestParser;
    private final BatchGeneratorService batchGeneratorService;
    private final BatchAnalyzerService batchAnalyzerService;

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
            @RequestParam(required = false) String stepType,
            @RequestBody String userInput) {

        try {
            if(stepType == null || stepType.isEmpty()){
                stepType = agentService.classifyStepTypeFromUserInput(userInput);
            }
            StepikBlockRequest stepikRequest = agentService.generateStep(sessionId, userInput, stepType);
            log.info("Generated step of type {} for session {}", stepType, sessionId);
            return ResponseEntity.ok(stepikRequest);
        } catch (Exception e) {
            log.error("Error in generateStep endpoint: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate-batch-steps")
    public ResponseEntity<List<StepikBlockRequest>> generateBatchSteps(
            @RequestParam String sessionId,
            @RequestBody BatchStepDTO batchStepDTO){

        log.info("Start generating batch steps with plan: {}", batchStepDTO);
        return ResponseEntity.ok(batchGeneratorService.generateBatchRequests(sessionId, batchStepDTO));
    }

    @PostMapping("/analyze-batch-request")
    public ResponseEntity<BatchStepDTO> analyzeBatchRequest(
            @RequestBody String userInput) {

        try {
            log.info("Analyzing batch request: {}", userInput);
            BatchStepDTO plan = batchAnalyzerService.analyzeUserInput(userInput);
            return ResponseEntity.ok(plan);
        } catch (Exception e) {
            log.error("Error analyzing batch request: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/modify-stepContent")
    public ResponseEntity<StepikBlockRequest> modifyStepContent(
            @RequestParam String sessionId,
            @RequestParam String stepType,
            @RequestParam String userInput,
            @RequestBody String previousStepikBlockRequestJson) {

        try {
            StepikBlockRequest previousStepikBlockRequest = stepikRequestParser.parseRequest(previousStepikBlockRequestJson, stepType);
            
            StepikBlockRequest stepikRequest = agentService.modifyStepContent(sessionId, userInput, stepType, previousStepikBlockRequest);
            log.info("Modified step content of type {} for session {}", stepType, sessionId);
            return ResponseEntity.ok(stepikRequest);
        } catch (Exception e) {
            log.error("Error in modifyStepContent endpoint: {}", e.getMessage(), e);
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
