package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.AgentService;
import org.core.service.agent.StepContentModifier;
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
    private final StepContentModifier stepContentModifier;

    @PostMapping("/chat")
    public ResponseEntity<String> chat(
            @RequestParam String sessionId,
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel) {

        try {
            LlmModel model = llmModel != null && !llmModel.trim().isEmpty() 
                    ? LlmModel.valueOf(llmModel.toUpperCase()) 
                    : null;
            String response = agentService.handleUserMessage(sessionId, userInput, model);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().body("Неверная модель LLM: " + llmModel);
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
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel) {

        try {
            if(stepType == null || stepType.isEmpty()){
                stepType = agentService.classifyStepTypeFromUserInput(userInput);
            }
            LlmModel model = llmModel != null && !llmModel.trim().isEmpty() 
                    ? LlmModel.valueOf(llmModel.toUpperCase()) 
                    : null;
            StepikBlockRequest stepikRequest = agentService.generateStep(sessionId, userInput, stepType, model);
            log.info("Generated step of type {} for session {} with model {}", stepType, sessionId, model);
            return ResponseEntity.ok(stepikRequest);
        } catch (IllegalArgumentException e) {
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().build();
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
            @RequestBody String previousStepikBlockRequestJson,
            @RequestParam(required = false) String llmModel) {

        try {
            StepikBlockRequest previousStepikBlockRequest = stepikRequestParser.parseRequest(previousStepikBlockRequestJson, stepType);
            
            LlmModel model = llmModel != null && !llmModel.trim().isEmpty() 
                    ? LlmModel.valueOf(llmModel.toUpperCase()) 
                    : null;
            StepikBlockRequest stepikRequest = stepContentModifier.modifyStepContent(sessionId, userInput, stepType, previousStepikBlockRequest, model);
            log.info("Modified step content of type {} for session {} with model {}", stepType, sessionId, model);
            return ResponseEntity.ok(stepikRequest);
        } catch (IllegalArgumentException e) {
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().build();
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
