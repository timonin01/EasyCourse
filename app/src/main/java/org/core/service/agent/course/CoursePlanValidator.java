package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoursePlanValidator {

    private final CourseStepTypeMapper stepTypeMapper;
    private final UserAccessService userAccessService;

    public void validate(Long courseId, Long userId, CoursePlanDTO plan) {
        if (plan == null || plan.getActions() == null || plan.getActions().isEmpty()) {
            throw new IllegalArgumentException("Пустой или некорректный план");
        }
        for (PlanActionDTO action : plan.getActions()) {
            validateAction(courseId, userId, action);
        }
    }

    public void verifyCourse(Long expectedCourseId, Long actualCourseId) {
        if (!expectedCourseId.equals(actualCourseId)) {
            throw new IllegalArgumentException("Выбранная сущность не принадлежит указанному курсу");
        }
    }

    private void validateAction(Long courseId, Long userId, PlanActionDTO action) {
        if (action == null || action.getType() == null) {
            throw new IllegalArgumentException("План содержит пустое действие");
        }
        switch (action.getType()) {
            case CREATE_SECTION -> {
                if (action.getSection() == null) {
                    throw new IllegalArgumentException("В плане отсутствует модуль");
                }
                validateLessons(action.getSection().getLessons());
            }
            case CREATE_LESSONS -> {
                if (action.getTargetSectionId() == null) {
                    throw new IllegalArgumentException("Не указан существующий модуль");
                }
                Section section = userAccessService.findSectionAndVerifyOwner(userId, action.getTargetSectionId());
                verifyCourse(courseId, section.getCourse().getId());
                validateLessons(action.getLessons());
            }
            case CREATE_STEPS -> {
                if (action.getTargetLessonId() == null) {
                    throw new IllegalArgumentException("Не указан существующий урок");
                }
                Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, action.getTargetLessonId());
                verifyCourse(courseId, lesson.getSection().getCourse().getId());
                validateSteps(action.getSteps());
            }
            case DELETE_SECTION -> {
                if (action.getTargetSectionId() == null) {
                    throw new IllegalArgumentException("Не указан модуль для удаления");
                }
                Section section = userAccessService.findSectionAndVerifyOwner(userId, action.getTargetSectionId());
                verifyCourse(courseId, section.getCourse().getId());
            }
            case DELETE_LESSON -> {
                if (action.getTargetLessonId() == null) {
                    throw new IllegalArgumentException("Не указан урок для удаления");
                }
                Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, action.getTargetLessonId());
                verifyCourse(courseId, lesson.getSection().getCourse().getId());
            }
            case DELETE_STEP -> {
                if (action.getTargetStepId() == null) {
                    throw new IllegalArgumentException("Не указан шаг для удаления");
                }
                Step step = userAccessService.findStepAndVerifyOwner(userId, action.getTargetStepId());
                verifyCourse(courseId, step.getLesson().getSection().getCourse().getId());
            }
            default -> throw new IllegalArgumentException("Неподдерживаемое действие: " + action.getType());
        }
    }

    private void validateLessons(List<LessonPlanDTO> lessons) {
        if (lessons == null) {
            return;
        }
        for (LessonPlanDTO lesson : lessons) {
            if (lesson == null) {
                throw new IllegalArgumentException("План содержит пустой урок");
            }
            validateSteps(lesson.getSteps());
        }
    }

    private void validateSteps(List<CountStepDTO> steps) {
        if (steps == null) {
            return;
        }
        for (CountStepDTO step : steps) {
            if (step == null || !stepTypeMapper.isSupported(step.getType())) {
                throw new IllegalArgumentException(
                        "Неподдерживаемый тип шага: " + (step == null ? "null" : step.getType()));
            }
            step.setType(stepTypeMapper.normalize(step.getType()));
            if (step.getCount() == null) {
                step.setCount(1);
            }
            if (step.getCount() < 1) {
                throw new IllegalArgumentException("Количество шагов должно быть не меньше 1");
            }
        }
    }
}
