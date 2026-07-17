package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.*;
import org.core.enums.CourseAgentMode;
import org.core.enums.LlmModel;
import org.core.service.agent.course.sse.PlanExecutionProgress;
import org.core.service.agent.course.tools.CourseAgentLoop;
import org.core.service.agent.course.tools.util.CoursePlanHelper;
import org.core.service.agent.course.tools.util.CoursePlanMessageBuilder;
import org.core.service.agent.course.util.StepsCounter;
import org.core.util.UserAccessService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAgentService {

    private final CourseAgentLoop agentLoop;
    private final CoursePlannerService plannerService;
    private final CoursePlanValidator planValidator;
    private final CoursePlanHelper coursePlanHelper;
    private final CoursePlanMessageBuilder coursePlanMessageBuilder;
    private final CourseAgentMemoryService memoryService;
    private final UserAccessService userAccessService;
    private final CoursePlanExecutionService planExecutionService;
    private final CourseStepModificationService stepModificationService;
    private final StepsCounter stepsCounter;
    private final ApplicationEventPublisher eventPublisher;

    public CourseAgentResponse handleChat(Long courseId, Long userId, String sessionId, String userInput, LlmModel llmModel, CourseAgentMode agentMode) {
        Course course = userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        memoryService.saveUserMessage(userId, courseId, sessionId, userInput);

        CourseAgentResponse response = agentLoop.run(
                course, userId, sessionId, userInput, llmModel, agentMode, history);
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse handleCandidate(Long courseId, Long userId, String sessionId,
                                               CourseAgentCandidateRequest request, LlmModel llmModel, CourseAgentMode agentMode) {
        Course course = userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        if (request != null && request.getCandidate() != null) {
            memoryService.saveUserMessage(userId, courseId, sessionId, "Выбран вариант: " + request.getCandidate().getLabel());
        }

        CourseAgentResponse response = agentLoop.resume(course, userId, sessionId,
                request == null ? null : request.getResumeContext(),
                request == null ? null : request.getCandidate(),
                llmModel, agentMode, history);
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse editPlan(Long courseId, Long userId, String sessionId,
                                        CoursePlanDTO currentPlan, String instruction, LlmModel llmModel) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        if (currentPlan != null && coursePlanHelper.hasDeleteActions(currentPlan.getActions())) {
            return CourseAgentResponse.error(
                    "План удаления нельзя изменить через чат. Подтвердите удаление или отмените план.");
        }
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        memoryService.saveUserMessage(userId, courseId, sessionId, instruction);

        planValidator.validate(courseId, userId, currentPlan);
        CoursePlanDTO editedPlan = plannerService.editPlan(currentPlan, instruction, llmModel, history);
        planValidator.validate(courseId, userId, editedPlan);
        if (editedPlan.getMessage() == null || editedPlan.getMessage().isBlank()) {
            editedPlan.setMessage(coursePlanMessageBuilder.buildSummary(editedPlan.getActions()));
        } else {
            editedPlan.setMessage(coursePlanMessageBuilder.sanitizeUserFacingMessage(editedPlan.getMessage()));
        }

        CourseAgentResponse response = CourseAgentResponse.builder()
                .action(CourseAgentAction.SHOW_PLAN)
                .message(editedPlan.getMessage())
                .plan(editedPlan)
                .build();
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse executePlan(Long courseId, Long userId, String sessionId, CoursePlanDTO plan, LlmModel llmModel) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        if (plan == null || plan.getActions() == null || plan.getActions().isEmpty()) {
            return CourseAgentResponse.error("Пустой или некорректный план");
        }
        planValidator.validate(courseId, userId, plan);

        List<PlanActionDTO> deleteActions = plan.getActions().stream()
                .filter(action -> action != null && coursePlanHelper.isDeleteAction(action.getType()))
                .toList();
        List<PlanActionDTO> createActions = plan.getActions().stream()
                .filter(action -> action != null && coursePlanHelper.isCreateAction(action.getType()))
                .toList();

        int plannedSteps = stepsCounter.countPlannedSteps(plan);
        PlanExecutionProgress planExecutionProgress = new PlanExecutionProgress(courseId, userId, sessionId, plannedSteps, eventPublisher);
        try {
            if (!createActions.isEmpty()) {
                planExecutionProgress.publishStarted();
            }
            if (!deleteActions.isEmpty()) {
                planExecutionService.executeDeleteActions(courseId, userId, deleteActions);
            }

            CourseAgentResponse agentResponse;
            if (!createActions.isEmpty()) {
                ExecutionDraftResult result = planExecutionService.executeCreateActions(
                        courseId, userId, sessionId, createActions, llmModel, planExecutionProgress);
                String message = String.format(
                        "Готово: создано модулей %d, уроков %d, шагов %d. "
                                + "Проверьте черновик и синхронизируйте со Stepik вручную.",
                        result.sectionIds().size(),
                        result.lessonIds().size(),
                        result.stepIds().size());
                agentResponse = CourseAgentResponse.builder()
                        .action(CourseAgentAction.DRAFT_READY)
                        .message(message)
                        .createdSectionIds(result.sectionIds())
                        .createdLessonIds(result.lessonIds())
                        .createdStepIds(result.stepIds())
                        .build();
                planExecutionProgress.publishDone(result.sectionIds(), result.lessonIds(), result.stepIds(), message);
            } else if (!deleteActions.isEmpty()) {
                agentResponse = CourseAgentResponse.builder()
                        .action(CourseAgentAction.ENTITY_DELETED)
                        .message(String.format(
                                "Удалено %d элемент(ов) из черновика курса. Синхронизация со Stepik не выполнялась.",
                                deleteActions.size()))
                        .build();
            } else {
                return CourseAgentResponse.error("В плане нет действий для выполнения");
            }

            memoryService.saveAssistantResponse(userId, courseId, sessionId, agentResponse);
            return agentResponse;
        } catch (RuntimeException e) {
            if (!createActions.isEmpty()) {
                planExecutionProgress.publishError(e.getMessage());
            }
            throw e;
        }
    }

    public CourseAgentResponse cancelPlan(Long courseId, Long userId, String sessionId) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        CourseAgentResponse response = CourseAgentResponse.builder()
                .action(CourseAgentAction.PLAN_CANCELLED)
                .message("План отменён. Опишите новую задачу, если нужно.")
                .build();
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse modifyStepById(Long courseId, Long userId, Long stepId,
                                            String sessionId, String userInput, LlmModel llmModel) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        memoryService.saveUserMessage(userId, courseId, sessionId, userInput);
        CourseAgentResponse response = stepModificationService.modifyById(
                courseId, userId, stepId, sessionId, userInput, llmModel, history);
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public String getLatestSessionId(Long courseId, Long userId) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        return memoryService.getLatestSessionId(userId, courseId).orElse(null);
    }

    public List<org.core.dto.ai.AiMessageHistoryDTO> getHistory(Long courseId, Long userId, String sessionId) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        return memoryService.getHistory(userId, courseId, sessionId);
    }

    public void clearSession(Long courseId, Long userId, String sessionId) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        memoryService.clearSession(userId, courseId, sessionId);
    }
}
