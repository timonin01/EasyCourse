package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.exception.exceptions.StepikLessonIntegrationException;
import org.core.exception.exceptions.StepikSectionIntegrationException;
import org.core.exception.exceptions.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.core.service.stepik.StepikCascadeDeleteService;
import org.core.service.stepik.step.StepikStepSyncService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseAgentDeletionService {

    private final SectionService sectionService;
    private final LessonService lessonService;
    private final StepService stepService;
    private final CoursePlanValidator planValidator;
    private final StepikCascadeDeleteService cascadeDeleteService;
    private final StepikStepSyncService stepSyncService;
    private final UserAccessService userAccessService;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;

    @Transactional
    public void executeDelete(Long courseId, Long userId, CoursePlanDTO plan) {
        planValidator.validate(courseId, userId, plan);
        for (PlanActionDTO action : plan.getActions()) {
            executeAction(userId, action);
        }
    }

    private void executeAction(Long userId, PlanActionDTO action) {
        if (action == null || action.getType() == null) {
            return;
        }
        switch (action.getType()) {
            case DELETE_SECTION -> deleteSectionFully(userId, action.getTargetSectionId());
            case DELETE_LESSON -> deleteLessonFully(userId, action.getTargetLessonId());
            case DELETE_STEP -> deleteStepFully(userId, action.getTargetStepId());
            default -> throw new IllegalArgumentException("Это действие нельзя выполнить как удаление: " + action.getType());
        }
    }

    private void deleteSectionFully(Long userId, Long sectionId) {
        Section section = userAccessService.findSectionAndVerifyOwner(userId, sectionId);
        List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(sectionId);

        try {
            if (section.getStepikSectionId() != null) {
                cascadeDeleteService.deleteFullSectionFromStepikById(sectionId, userId);
            } else {
                for (Lesson lesson : lessons) {
                    deleteLessonFromStepikOnly(userId, lesson);
                }
            }
        } catch (RuntimeException ex) {
            log.error("Failed to delete section {} from Stepik: {}", sectionId, ex.getMessage(), ex);
            throw new StepikSectionIntegrationException(
                    "Не удалось удалить модуль «" + section.getTitle() + "» на Stepik. Локальная копия сохранена.");
        }

        sectionService.deleteSection(sectionId);
        log.info("Section {} fully deleted (Stepik + local)", sectionId);
    }

    private void deleteLessonFully(Long userId, Long lessonId) {
        Lesson lesson = userAccessService.findLessonAndVerifyOwner(userId, lessonId);

        try {
            deleteLessonFromStepikOnly(userId, lesson);
        } catch (RuntimeException ex) {
            log.error("Failed to delete lesson {} from Stepik: {}", lessonId, ex.getMessage(), ex);
            throw new StepikLessonIntegrationException(
                    "Не удалось удалить урок «" + lesson.getTitle() + "» на Stepik. Локальная копия сохранена.");
        }

        lessonService.deleteLesson(lessonId);
        log.info("Lesson {} fully deleted (Stepik + local)", lessonId);
    }

    private void deleteStepFully(Long userId, Long stepId) {
        Step step = userAccessService.findStepAndVerifyOwner(userId, stepId);

        try {
            if (step.getStepikStepId() != null) {
                stepSyncService.deleteStepFromStepik(stepId);
            }
        } catch (RuntimeException ex) {
            log.error("Failed to delete step {} from Stepik: {}", stepId, ex.getMessage(), ex);
            throw new StepikStepIntegrationException(
                    "Не удалось удалить шаг на Stepik. Локальная копия сохранена.");
        }

        stepService.deleteStep(stepId);
        log.info("Step {} fully deleted (Stepik + local)", stepId);
    }

    private void deleteLessonFromStepikOnly(Long userId, Lesson lesson) {
        if (lesson.getStepikLessonId() != null) {
            cascadeDeleteService.deleteFullLessonFromStepikById(lesson.getId(), userId);
            return;
        }

        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId());
        steps.stream()
                .filter(step -> step.getStepikStepId() != null)
                .sorted(Comparator.comparing(Step::getPosition))
                .forEach(step -> stepSyncService.deleteStepFromStepik(step.getId()));
    }
}
