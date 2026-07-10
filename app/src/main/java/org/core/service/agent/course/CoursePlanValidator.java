package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CoursePlanValidator {

    private final CourseStepTypeMapper stepTypeMapper;
    private final UserAccessService userAccessService;

    public void validate(Long courseId, Long userId, CoursePlanDTO plan) {
        if (plan == null || plan.getIntent() == null) {
            throw new IllegalArgumentException("Пустой или некорректный план");
        }

        switch (plan.getIntent()) {
            case CREATE_SECTION -> {
                if (plan.getSection() == null) {
                    throw new IllegalArgumentException("В плане отсутствует модуль");
                }
                validateLessons(plan.getSection().getLessons());
            }
            case CREATE_LESSON -> {
                if (plan.getTargetSectionId() == null) {
                    throw new IllegalArgumentException("Не указан существующий модуль");
                }
                Section section = userAccessService.findSectionAndVerifyOwner(userId, plan.getTargetSectionId());
                verifyCourse(courseId, section.getCourse().getId());
                validateLessons(plan.getLessons());
            }
            case CREATE_STEPS -> {
                if (plan.getTargetLessonId() == null) {
                    throw new IllegalArgumentException("Не указан существующий урок");
                }
                Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, plan.getTargetLessonId());
                verifyCourse(courseId, lesson.getSection().getCourse().getId());
                validateSteps(plan.getSteps());
            }
            case DELETE_SECTION -> {
                if (plan.getTargetSectionId() == null) {
                    throw new IllegalArgumentException("Не указан модуль для удаления");
                }
                Section section = userAccessService.findSectionAndVerifyOwner(userId, plan.getTargetSectionId());
                verifyCourse(courseId, section.getCourse().getId());
            }
            case DELETE_LESSON -> {
                if (plan.getTargetLessonId() == null) {
                    throw new IllegalArgumentException("Не указан урок для удаления");
                }
                Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, plan.getTargetLessonId());
                verifyCourse(courseId, lesson.getSection().getCourse().getId());
            }
            case DELETE_STEP -> {
                if (plan.getTargetStepId() == null) {
                    throw new IllegalArgumentException("Не указан шаг для удаления");
                }
                var step = userAccessService.findStepAndVerifyOwner(userId, plan.getTargetStepId());
                verifyCourse(courseId, step.getLesson().getSection().getCourse().getId());
            }
            default -> throw new IllegalArgumentException("Этот тип плана нельзя выполнить");
        }
    }

    public void verifyCourse(Long expectedCourseId, Long actualCourseId) {
        if (!expectedCourseId.equals(actualCourseId)) {
            throw new IllegalArgumentException("Выбранная сущность не принадлежит указанному курсу");
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
