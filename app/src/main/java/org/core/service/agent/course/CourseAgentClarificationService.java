package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentCandidateRequest;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.EntityCandidateDTO;
import org.core.enums.LlmModel;
import org.core.service.agent.course.router.CourseIntentClassifier;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAgentClarificationService {

    private final CourseIntentClassifier intentClassifier;
    private final CourseEntityResolver entityResolver;
    private final CourseAgentPlanningService planningService;
    private final CourseStepModificationService stepModificationService;
    private final CourseAgentDeletionService deletionService;
    private final CoursePlanValidator planValidator;
    private final UserAccessService userAccessService;

    public CourseAgentResponse handleCandidate(Long courseId, Long userId, String sessionId,
                                               CourseAgentCandidateRequest request, LlmModel llmModel,
                                               List<ChatMessage> history) {
        Course course = userAccessService.findByCourseIdAndVerifyOwner(userId, courseId);
        validateRequest(request);

        CourseAgentIntent intent = request.getIntent();
        EntityCandidateDTO candidate = request.getCandidate();
        String originalInput = request.getOriginalInput() == null ? "" : request.getOriginalInput();
        CourseIntentResult parsed = intentClassifier.classify(originalInput);

        return switch (candidate.getType()) {
            case "section" -> continueFromSection(
                    course, userId, sessionId, intent, candidate.getId(),
                    parsed, originalInput, llmModel, history);
            case "lesson" -> continueFromLesson(
                    course, userId, sessionId, intent, candidate.getId(),
                    parsed, originalInput, llmModel, history);
            case "step" -> {
                if (intent == CourseAgentIntent.MODIFY_STEP) {
                    yield stepModificationService.modifyById(
                            courseId, userId, candidate.getId(), sessionId,
                            originalInput, llmModel, history);
                }
                if (intent == CourseAgentIntent.DELETE_STEP) {
                    yield deletionService.planDeleteStepById(courseId, userId, candidate.getId());
                }
                throw new IllegalArgumentException("Шаг нельзя выбрать для этого действия");
            }
            default -> throw new IllegalArgumentException("Неизвестный тип выбранного варианта");
        };
    }

    private CourseAgentResponse continueFromSection(Course course, Long userId, String sessionId,
                                                    CourseAgentIntent intent, Long sectionId,
                                                    CourseIntentResult parsed, String originalInput,
                                                    LlmModel llmModel, List<ChatMessage> history) {
        Section section = userAccessService.findSectionAndVerifyOwner(userId, sectionId);
        planValidator.verifyCourse(course.getId(), section.getCourse().getId());
        if (intent == CourseAgentIntent.DELETE_SECTION) {
            return deletionService.planDeleteSection(section);
        }
        if (intent == CourseAgentIntent.CREATE_LESSON) {
            return planningService.planLessonsInSection(
                    section, originalInput, llmModel, history);
        }
        if (intent == CourseAgentIntent.CREATE_STEPS || intent == CourseAgentIntent.MODIFY_STEP
                || intent == CourseAgentIntent.DELETE_LESSON || intent == CourseAgentIntent.DELETE_STEP) {
            CourseResolution<Lesson> lessons =
                    entityResolver.resolveLesson(section.getId(), parsed.lessonHint());
            return continueAfterLessonResolution(
                    sessionId, intent, lessons, parsed, originalInput, llmModel, history);
        }
        throw new IllegalArgumentException("Модуль нельзя выбрать для этого действия");
    }

    private CourseAgentResponse continueFromLesson(Course course, Long userId, String sessionId,
                                                   CourseAgentIntent intent, Long lessonId,
                                                   CourseIntentResult parsed, String originalInput,
                                                   LlmModel llmModel, List<ChatMessage> history) {
        Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, lessonId);
        planValidator.verifyCourse(course.getId(), lesson.getSection().getCourse().getId());
        if (intent == CourseAgentIntent.DELETE_LESSON) {
            return deletionService.planDeleteLesson(lesson);
        }
        if (intent == CourseAgentIntent.CREATE_STEPS) {
            return planningService.planStepsInLesson(lesson, originalInput);
        }
        if (intent == CourseAgentIntent.MODIFY_STEP) {
            return stepModificationService.modifyByLesson(
                    lesson, sessionId, parsed.stepHint(), originalInput, llmModel, history);
        }
        throw new IllegalArgumentException("Урок нельзя выбрать для этого действия");
    }

    private CourseAgentResponse continueAfterLessonResolution(String sessionId, CourseAgentIntent intent, CourseResolution<Lesson> resolution,
            CourseIntentResult parsed, String originalInput, LlmModel llmModel, List<ChatMessage> history) {
        if (resolution.isAmbiguous()) {
            String message = switch (intent) {
                case MODIFY_STEP -> "Уточните, в каком уроке находится шаг:";
                case DELETE_STEP -> "Уточните, в каком уроке удалить шаг:";
                case DELETE_LESSON -> "Уточните, какой урок удалить:";
                default -> "Уточните, в какой урок добавить шаги:";
            };
            return CourseAgentResponse.clarify(message, resolution.candidates(), intent);
        }
        if (!resolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл подходящий урок в выбранном модуле.",
                    List.of(),
                    intent);
        }
        if (intent == CourseAgentIntent.CREATE_STEPS) {
            return planningService.planStepsInLesson(resolution.value(), originalInput);
        }
        if (intent == CourseAgentIntent.DELETE_LESSON) {
            return deletionService.planDeleteLesson(resolution.value());
        }
        if (intent == CourseAgentIntent.DELETE_STEP) {
            return deletionService.planDeleteStepInLesson(resolution.value(), parsed.stepHint());
        }
        return stepModificationService.modifyByLesson(
                resolution.value(), sessionId, parsed.stepHint(), originalInput, llmModel, history);
    }

    private void validateRequest(CourseAgentCandidateRequest request) {
        if (request == null || request.getIntent() == null || request.getCandidate() == null
                || request.getCandidate().getId() == null) {
            throw new IllegalArgumentException("Не указан выбранный вариант");
        }
    }
}
