package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.PromptLengthExceededException;
import org.core.exception.exceptions.SubscriptionLimitExceededException;
import org.core.service.agent.AgentService;
import org.core.service.ai.AiPromptLimitService;
import org.core.service.agent.StepContentModifier;
import org.core.service.agent.batch.BatchAnalyzerService;
import org.core.service.agent.batch.BatchGeneratorService;
import org.core.service.agent.StepikRequestParser;
import org.core.service.ai.BatchSessionMessageService;
import org.core.service.subscription.SubscriptionService;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
    private final BatchSessionMessageService batchSessionMessageService;
    private final StepContentModifier stepContentModifier;

    private final SubscriptionService subscriptionService;
    private final AiPromptLimitService aiPromptLimitService;
    private final UserContextBean userContextBean;
    private final ObjectMapper objectMapper;

    @PostMapping("/chat")
    public ResponseEntity<?> chat(
            @RequestParam String sessionId,
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateChatPrompt(userInput);
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            String response = agentService.handleUserMessage(userId, sessionId, userInput, model);
            subscriptionService.recordAiUsage(userId, 1);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ResponseEntity<?> sessionError = sessionAccessDeniedResponse(e);
            if (sessionError != null) {
                return sessionError;
            }
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().body("Неверная модель LLM: " + llmModel);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error in chat endpoint: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Ошибка при обработке запроса");
        }
    }

    @PostMapping("/generate-step")
    public ResponseEntity<?> generateStep(
            @RequestParam String sessionId,
            @RequestParam(required = false) String stepType,
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateGeneratePrompt(userInput);
            if (stepType == null || stepType.isEmpty()) {
                stepType = agentService.classifyStepTypeFromUserInput(userInput);
            }
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            StepikBlockRequest stepikRequest = agentService.generateStep(userId, sessionId, userInput, stepType, model, true);
            subscriptionService.recordAiUsage(userId, 1);
            log.info("Generated step of type {} for session {} with model {}", stepType, sessionId, model);
            return ResponseEntity.ok(stepikRequest);
        } catch (IllegalArgumentException e) {
            ResponseEntity<?> sessionError = sessionAccessDeniedResponse(e);
            if (sessionError != null) {
                return sessionError;
            }
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().build();
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error in generateStep endpoint: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate-batch-steps")
    public ResponseEntity<?> generateBatchSteps(
            @RequestParam String sessionId,
            @RequestBody BatchStepDTO batchStepDTO) {
        Long batchGenerationId = null;
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateBatchPlan(batchStepDTO);
            subscriptionService.validateBatchPlan(userId, batchStepDTO);

            int totalSteps = SubscriptionService.countBatchSteps(batchStepDTO);
            batchGenerationId = batchSessionMessageService.startGeneration(
                    userId, buildUserInputFromPlan(batchStepDTO), batchStepDTO, totalSteps);

            log.info("Start generating batch steps with plan: {}", batchStepDTO);
            List<StepikBlockRequest> results = batchGeneratorService.generateBatchRequests(userId, sessionId, batchStepDTO);
            subscriptionService.recordAiUsage(userId, totalSteps);
            batchSessionMessageService.markCompleted(batchGenerationId, results);
            String json = objectMapper
                    .writerFor(new TypeReference<List<StepikBlockRequest>>() {})
                    .writeValueAsString(results);
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(json);
        } catch (PromptLengthExceededException e) {
            batchSessionMessageService.markFailed(batchGenerationId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalArgumentException e) {
            batchSessionMessageService.markFailed(batchGenerationId, e.getMessage());
            log.warn("Invalid batch plan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            batchSessionMessageService.markFailed(batchGenerationId, e.getMessage());
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            batchSessionMessageService.markFailed(batchGenerationId, e.getMessage());
            log.error("Error in generateBatchSteps endpoint: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при генерации batch шагов");
        }
    }

    @PostMapping("/analyze-batch-request")
    public ResponseEntity<?> analyzeBatchRequest(@RequestBody String userInput) {
        try {
            aiPromptLimitService.validateBatchPrompt(userInput);
            log.info("Analyzing batch request: {}", userInput);
            BatchStepDTO plan = batchAnalyzerService.analyzeUserInput(userInput);
            return ResponseEntity.ok(plan);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error analyzing batch request: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/modify-stepContent")
    public ResponseEntity<?> modifyStepContent(
            @RequestParam String sessionId,
            @RequestParam String stepType,
            @RequestParam String userInput,
            @RequestBody String previousStepikBlockRequestJson,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateGeneratePrompt(userInput);
            StepikBlockRequest previousStepikBlockRequest = stepikRequestParser.parseRequest(previousStepikBlockRequestJson, stepType);
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            StepikBlockRequest stepikRequest = stepContentModifier.modifyStepContent(
                    sessionId, userInput, stepType, previousStepikBlockRequest, model);
            subscriptionService.recordAiUsage(userId, 1);
            log.info("Modified step content of type {} for session {} with model {}", stepType, sessionId, model);
            return ResponseEntity.ok(stepikRequest);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Invalid LLM model: {}", llmModel);
            return ResponseEntity.badRequest().build();
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error in modifyStepContent endpoint: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private LlmModel parseLlmModel(String llmModel) {
        if (llmModel == null || llmModel.trim().isEmpty()) {
            return null;
        }
        return LlmModel.valueOf(llmModel.toUpperCase());
    }

    private String buildUserInputFromPlan(BatchStepDTO batchStepDTO) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null || batchStepDTO.getSteps().isEmpty()) {
            return "Batch generation";
        }
        StringBuilder builder = new StringBuilder();
        for (CountStepDTO step : batchStepDTO.getSteps()) {
            if (builder.length() > 0) {
                builder.append("; ");
            }
            int count = step.getCount() == null || step.getCount() < 1 ? 1 : step.getCount();
            builder.append(count).append("x ").append(step.getType());
            if (step.getSpecificInput() != null && !step.getSpecificInput().isBlank()) {
                builder.append(": ").append(step.getSpecificInput());
            }
        }
        return builder.toString();
    }

    private ResponseEntity<?> sessionAccessDeniedResponse(IllegalArgumentException e) {
        if ("Session does not belong to user".equals(e.getMessage())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
        return null;
    }
}


