package org.core.rest.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.context.UserContextBean;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentCandidateRequest;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.ExecutePlanRequest;
import org.core.dto.agent.course.EditCoursePlanRequest;
import org.core.enums.CourseAgentMode;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.PromptLengthExceededException;
import org.core.exception.exceptions.SubscriptionLimitExceededException;
import org.core.service.agent.course.CourseAgentService;
import org.core.service.agent.course.util.StepsCounter;
import org.core.service.agent.course.sse.SseNotificationService;
import org.core.service.ai.AiPromptLimitService;
import org.core.service.subscription.SubscriptionService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Collections;

@RestController
@RequestMapping("/api/agent/course")
@RequiredArgsConstructor
@Slf4j
public class CourseAgentController {

    private final CourseAgentService courseAgentService;
    private final SubscriptionService subscriptionService;
    private final AiPromptLimitService aiPromptLimitService;
    private final StepsCounter stepsCounter;
    private final SseNotificationService sseNotificationService;
    private final UserContextBean userContextBean;

    @GetMapping("/{courseId}/sessions/latest")
    public ResponseEntity<?> getLatestSession(@PathVariable Long courseId) {
        Long userId = userContextBean.getUserId();
        try {
            String sessionId = courseAgentService.getLatestSessionId(courseId, userId);
            return ResponseEntity.ok(Collections.singletonMap("sessionId", sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error loading latest course agent session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при загрузке сессии агента");
        }
    }

    @GetMapping("/{courseId}/sessions/{sessionId}/history")
    public ResponseEntity<?> getHistory(
            @PathVariable Long courseId,
            @PathVariable String sessionId) {
        Long userId = userContextBean.getUserId();
        try {
            return ResponseEntity.ok(courseAgentService.getHistory(courseId, userId, sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error loading course agent history: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при загрузке истории агента");
        }
    }

    @DeleteMapping("/{courseId}/sessions/{sessionId}")
    public ResponseEntity<?> clearSession(
            @PathVariable Long courseId,
            @PathVariable String sessionId) {
        Long userId = userContextBean.getUserId();
        try {
            courseAgentService.clearSession(courseId, userId, sessionId.trim());
            return ResponseEntity.ok("Session cleared");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error clearing course agent session: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при сбросе сессии агента");
        }
    }

    @PostMapping("/{courseId}/chat")
    public ResponseEntity<?> chat(
            @PathVariable Long courseId,
            @RequestParam String sessionId,
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel,
            @RequestParam(required = false, defaultValue = "AGENT") String agentMode) {
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateChatPrompt(userInput);
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            CourseAgentResponse response = courseAgentService.handleChat(
                    courseId, userId, sessionId, userInput, model, CourseAgentMode.parse(agentMode));
            if (response.getAction() == CourseAgentAction.STEP_MODIFIED) {
                subscriptionService.recordAiUsage(userId, 1);
            }
            return ResponseEntity.ok(response);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid course agent chat request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error in course agent chat: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при обработке запроса агента");
        }
    }

    @PostMapping("/{courseId}/select-candidate")
    public ResponseEntity<?> selectCandidate(
            @PathVariable Long courseId,
            @RequestParam String sessionId,
            @RequestBody CourseAgentCandidateRequest request,
            @RequestParam(required = false) String llmModel,
            @RequestParam(required = false, defaultValue = "AGENT") String agentMode) {
        Long userId = userContextBean.getUserId();
        try {
            String originalInput = request == null ? null : request.getOriginalInput();
            aiPromptLimitService.validateChatPrompt(originalInput);
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            CourseAgentResponse response = courseAgentService.handleCandidate(
                    courseId, userId, sessionId, request, model, CourseAgentMode.parse(agentMode));
            if (response.getAction() == CourseAgentAction.STEP_MODIFIED) {
                subscriptionService.recordAiUsage(userId, 1);
            }
            return ResponseEntity.ok(response);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid course agent candidate request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error selecting course agent candidate: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при обработке выбранного варианта");
        }
    }

    @PostMapping("/{courseId}/edit-plan")
    public ResponseEntity<?> editPlan(
            @PathVariable Long courseId,
            @RequestParam String sessionId,
            @RequestBody EditCoursePlanRequest request,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            if (request == null || request.getPlan() == null) {
                return ResponseEntity.badRequest().body("Пустой или некорректный план");
            }
            aiPromptLimitService.validateChatPrompt(request.getInstruction());
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            return ResponseEntity.ok(courseAgentService.editPlan(
                    courseId, userId, sessionId,
                    request.getPlan(), request.getInstruction(), model));
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid course agent plan revision: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error revising course agent plan: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при корректировке плана");
        }
    }

    @PostMapping("/{courseId}/cancel-plan")
    public ResponseEntity<?> cancelPlan(
            @PathVariable Long courseId,
            @RequestParam String sessionId) {
        Long userId = userContextBean.getUserId();
        try {
            return ResponseEntity.ok(
                    courseAgentService.cancelPlan(courseId, userId, sessionId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error cancelling course agent plan: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при отмене плана");
        }
    }

    @PostMapping("/{courseId}/execute-plan")
    public ResponseEntity<?> executePlan(
            @PathVariable Long courseId,
            @RequestParam String sessionId,
            @RequestBody ExecutePlanRequest executePlanRequest,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            CoursePlanDTO coursePlan = executePlanRequest != null ? executePlanRequest.getPlan() : null;
            if (coursePlan == null || coursePlan.getActions() == null || coursePlan.getActions().isEmpty()) {
                return ResponseEntity.badRequest().body("Пустой или некорректный план");
            }

            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            int plannedSteps = stepsCounter.countPlannedSteps(coursePlan);
            if (plannedSteps > 0) {
                subscriptionService.validateAiGenerationAllowed(userId, plannedSteps);
            }

            CourseAgentResponse response = courseAgentService.executePlan(courseId, userId, sessionId, coursePlan, model);

            int createdSteps = response.getCreatedStepIds() == null ? 0 : response.getCreatedStepIds().size();
            if (createdSteps > 0) {
                subscriptionService.recordAiUsage(userId, createdSteps);
            }
            return ResponseEntity.ok(response);
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid execute-plan executePlanRequest: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error executing course agent plan: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при выполнении плана");
        }
    }

    @PostMapping(value = "/{courseId}/execute-plan/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter executePlanStream(
            @PathVariable Long courseId,
            @RequestParam String sessionId) {
        Long userId = userContextBean.getUserId();
        return sseNotificationService.subscribe(courseId, userId, sessionId);
    }

    @PostMapping("/{courseId}/steps/{stepId}/modify")
    public ResponseEntity<?> modifyStep(
            @PathVariable Long courseId,
            @PathVariable Long stepId,
            @RequestParam String sessionId,
            @RequestBody String userInput,
            @RequestParam(required = false) String llmModel) {
        Long userId = userContextBean.getUserId();
        try {
            aiPromptLimitService.validateGeneratePrompt(userInput);
            LlmModel model = parseLlmModel(llmModel);
            subscriptionService.validateModelAccess(userId, model);
            subscriptionService.validateAiGenerationAllowed(userId, 1);

            CourseAgentResponse response = courseAgentService.modifyStepById(
                    courseId, userId, stepId, sessionId, userInput, model);

            if (response.getAction() == CourseAgentAction.STEP_MODIFIED) {
                subscriptionService.recordAiUsage(userId, 1);
            }
            return ResponseEntity.ok(response);
        } catch (PromptLengthExceededException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (SubscriptionLimitExceededException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid modify-step request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error modifying step {}: {}", stepId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Ошибка при изменении шага");
        }
    }

    private LlmModel parseLlmModel(String llmModel) {
        if (llmModel == null || llmModel.trim().isEmpty()) {
            return null;
        }
        return LlmModel.valueOf(llmModel.toUpperCase());
    }

}
