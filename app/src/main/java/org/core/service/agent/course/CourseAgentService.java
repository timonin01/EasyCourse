package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentCandidateRequest;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.ai.AiMessageHistoryDTO;
import org.core.enums.LlmModel;
import org.core.service.agent.course.router.CourseIntentClassifier;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAgentService {

    private final CourseIntentClassifier intentClassifier;
    private final CourseAgentPlanningService planningService;
    private final CourseAgentClarificationService clarificationService;
    private final CourseStepModificationService stepModificationService;
    private final CourseDraftGenerationService draftGenerationService;
    private final CourseAgentDeletionService deletionService;
    private final CoursePlanValidator planValidator;
    private final CourseAgentMemoryService memoryService;
    private final UserAccessService userAccessService;

    public CourseAgentResponse handleChat(Long courseId, Long userId, String sessionId,
                                          String userInput, LlmModel llmModel) {
        Course course = userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        memoryService.saveUserMessage(userId, courseId, sessionId, userInput);
        CourseIntentResult intent = intentClassifier.classify(userInput, history);

        CourseAgentResponse response = switch (intent.intent()) {
            case CREATE_SECTION -> planningService.planSection(course, userInput, llmModel, history);
            case CREATE_LESSON -> planningService.planLessons(
                    course, intent, userInput, llmModel, history);
            case CREATE_STEPS -> planningService.planSteps(course, intent, userInput);
            case MODIFY_STEP -> stepModificationService.modifyByIntent(
                    course, sessionId, userInput, intent, llmModel, history);
            case DELETE_SECTION -> deletionService.planDeleteSection(course, intent);
            case DELETE_LESSON -> deletionService.planDeleteLesson(course, intent);
            case DELETE_STEP -> deletionService.planDeleteStep(course, intent);
            case UNKNOWN -> CourseAgentResponse.clarify(
                    "Не удалось понять запрос. Уточните, что нужно: создать модуль, добавить урок, "
                            + "добавить шаги в урок, исправить шаг или удалить модуль, урок или шаг.",
                    List.of(),
                    CourseAgentIntent.UNKNOWN);
        };
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse handleCandidate(Long courseId, Long userId, String sessionId,
                                               CourseAgentCandidateRequest request, LlmModel llmModel) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        if (request != null && request.getCandidate() != null) {
            memoryService.saveUserMessage(
                    userId,
                    courseId,
                    sessionId,
                    "Выбран вариант: " + request.getCandidate().getLabel());
        }
        CourseAgentResponse response = clarificationService.handleCandidate(
                courseId, userId, sessionId, request, llmModel, history);
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse editPlan(Long courseId, Long userId, String sessionId,
                                        CoursePlanDTO currentPlan, String instruction, LlmModel llmModel) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        if (currentPlan != null && CourseAgentDeletionService.isDeleteIntent(currentPlan.getIntent())) {
            return CourseAgentResponse.error(
                    "План удаления нельзя изменить через чат. Подтвердите удаление или отмените план.");
        }
        List<ChatMessage> history = memoryService.getLlmHistory(userId, courseId, sessionId);
        memoryService.saveUserMessage(userId, courseId, sessionId, instruction);
        CourseAgentResponse response = planningService.editPlan(
                courseId, userId, currentPlan, instruction, llmModel, history);
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
    }

    public CourseAgentResponse executePlan(Long courseId, Long userId, String sessionId,
                                           CoursePlanDTO plan) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        if (plan == null || plan.getIntent() == null) {
            return CourseAgentResponse.error("Пустой или некорректный план");
        }
        planValidator.validate(courseId, userId, plan);

        if (CourseAgentDeletionService.isDeleteIntent(plan.getIntent())) {
            CourseAgentResponse response = deletionService.executeDelete(courseId, userId, plan);
            memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
            return response;
        }

        ExecutionDraftResult result =
                draftGenerationService.executePlan(courseId, userId, sessionId, plan);

        CourseAgentResponse response = CourseAgentResponse.builder()
                .action(CourseAgentAction.DRAFT_READY)
                .message(String.format(
                        "Готово: создано модулей %d, уроков %d, шагов %d. "
                                + "Проверьте черновик и синхронизируйте со Stepik вручную.",
                        result.sectionIds().size(),
                        result.lessonIds().size(),
                        result.stepIds().size()))
                .createdSectionIds(result.sectionIds())
                .createdLessonIds(result.lessonIds())
                .createdStepIds(result.stepIds())
                .build();
        memoryService.saveAssistantResponse(userId, courseId, sessionId, response);
        return response;
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

    public List<AiMessageHistoryDTO> getHistory(Long courseId, Long userId, String sessionId) {
        userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        return memoryService.getHistory(userId, courseId, sessionId);
    }
}
