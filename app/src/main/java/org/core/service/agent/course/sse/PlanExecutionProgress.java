package org.core.service.agent.course.sse;

import lombok.Getter;
import org.core.domain.StepType;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.course.sse.PlanExecutionEvent;
import org.core.dto.agent.course.sse.PlanExecutionEventType;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

@Getter
public class PlanExecutionProgress {

    private final Long courseId;
    private final Long userId;
    private final String sessionId;
    private final int totalSteps;
    private int createdSteps;
    private final ApplicationEventPublisher eventPublisher;

    public PlanExecutionProgress(Long courseId, Long userId, String sessionId, int totalSteps,
                                 ApplicationEventPublisher eventPublisher) {
        this.courseId = courseId;
        this.userId = userId;
        this.sessionId = sessionId;
        this.totalSteps = Math.max(totalSteps, 0);
        this.eventPublisher = eventPublisher;
    }

    public int current() {
        return createdSteps;
    }

    public void publishStarted() {
        emit(base(PlanExecutionEventType.STARTED)
                .message("Начинаю генерацию: " + totalSteps + " шаг(ов)"));
    }

    public void publishSectionCreated(String sectionTitle, Long sectionId, Integer position) {
        emit(base(PlanExecutionEventType.SECTION_CREATED)
                .sectionTitle(sectionTitle)
                .createdSectionId(sectionId)
                .sectionPosition(position)
                .planActionType(PlanActionType.CREATE_SECTION)
                .message("Создан модуль «" + safeTitle(sectionTitle) + "»"));
    }

    public void publishLessonCreated(String sectionTitle, String lessonTitle, Long lessonId,
                                     Long sectionId, Integer position) {
        emit(base(PlanExecutionEventType.LESSON_CREATED)
                .sectionTitle(sectionTitle)
                .lessonTitle(lessonTitle)
                .createdLessonId(lessonId)
                .createdSectionId(sectionId)
                .lessonPosition(position)
                .planActionType(PlanActionType.CREATE_LESSONS)
                .message("Создан урок «" + safeTitle(lessonTitle) + "»"));
    }

    public void publishStepStarted(String lessonTitle, StepType stepType, Long lessonId,
                                   PlanActionType actionType) {
        String typeLabel = stepTypeLabel(stepType);
        emit(base(PlanExecutionEventType.STEP_STARTED)
                .lessonTitle(lessonTitle)
                .stepType(stepType)
                .createdLessonId(lessonId)
                .planActionType(actionType)
                .message(String.format("Генерирую %s · урок «%s» (%d/%d)",
                        typeLabel, safeTitle(lessonTitle), current(), totalSteps)));
    }

    public void publishStepCreated(String lessonTitle, StepType stepType, Long stepId, Long lessonId,
                                   Integer position, PlanActionType actionType) {
        createdSteps++;
        String typeLabel = stepTypeLabel(stepType);
        emit(base(PlanExecutionEventType.STEP_CREATED)
                .lessonTitle(lessonTitle)
                .stepType(stepType)
                .createdStepId(stepId)
                .createdLessonId(lessonId)
                .stepPosition(position)
                .planActionType(actionType)
                .message(String.format("Готово: %s · «%s» · шаг %s (%d/%d)",
                        typeLabel,
                        safeTitle(lessonTitle),
                        position == null ? "?" : position,
                        createdSteps,
                        totalSteps)));
    }

    public void publishStepFailed(String lessonTitle, StepType stepType, Long lessonId, String reason) {
        String typeLabel = stepTypeLabel(stepType);
        emit(base(PlanExecutionEventType.STEP_FAILED)
                .lessonTitle(lessonTitle)
                .stepType(stepType)
                .createdLessonId(lessonId)
                .message(String.format("Не удалось сгенерировать %s · «%s»: %s",
                        typeLabel, safeTitle(lessonTitle), reason == null ? "ошибка" : reason)));
    }

    public void publishDone(List<Long> sectionIds, List<Long> lessonIds, List<Long> stepIds, String message) {
        emit(base(PlanExecutionEventType.DONE)
                .createdSectionIds(sectionIds)
                .createdLessonIds(lessonIds)
                .createdStepIds(stepIds)
                .message(message));
    }

    public void publishError(String message) {
        emit(base(PlanExecutionEventType.ERROR)
                .message(message == null ? "Ошибка выполнения плана" : message));
    }

    private PlanExecutionEvent.PlanExecutionEventBuilder base(PlanExecutionEventType type) {
        return PlanExecutionEvent.builder()
                .planExecutionEventType(type)
                .courseId(courseId)
                .userId(userId)
                .sessionId(sessionId)
                .currentCreatedSteps(createdSteps)
                .totalSteps(totalSteps);
    }

    private void emit(PlanExecutionEvent.PlanExecutionEventBuilder builder) {
        eventPublisher.publishEvent(builder.build());
    }

    private static String safeTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Без названия";
        }
        return title.trim();
    }

    private static String stepTypeLabel(StepType stepType) {
        return stepType == null ? "step" : stepType.name().toLowerCase().replace('_', '-');
    }
}
