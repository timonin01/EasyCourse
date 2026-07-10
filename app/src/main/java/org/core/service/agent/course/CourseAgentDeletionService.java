package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentIntent;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.service.crud.LessonService;
import org.core.service.crud.SectionService;
import org.core.service.crud.StepService;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseAgentDeletionService {

    private final CourseEntityResolver entityResolver;
    private final SectionService sectionService;
    private final LessonService lessonService;
    private final StepService stepService;
    private final CoursePlanValidator planValidator;
    private final UserAccessService userAccessService;

    public CourseAgentResponse planDeleteSection(Course course, CourseIntentResult intent) {
        CourseResolution<Section> resolution = entityResolver.resolveSection(course.getId(), intent.sectionHint());
        if (resolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, какой модуль удалить:",
                    resolution.candidates(),
                    CourseAgentIntent.DELETE_SECTION);
        }
        if (!resolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл модуль для удаления. Уточните название или номер.",
                    List.of(),
                    CourseAgentIntent.DELETE_SECTION);
        }
        return showDeletePlan(buildSectionDeletePlan(resolution.value()));
    }

    public CourseAgentResponse planDeleteSection(Section section) {
        return showDeletePlan(buildSectionDeletePlan(section));
    }

    public CourseAgentResponse planDeleteLesson(Course course, CourseIntentResult intent) {
        CourseResolution<Lesson> resolution = entityResolver.resolveLesson(course, intent);
        if (resolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, какой урок удалить:",
                    resolution.candidates(),
                    CourseAgentIntent.DELETE_LESSON);
        }
        if (!resolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл урок для удаления. Уточните модуль, название или номер урока.",
                    List.of(),
                    CourseAgentIntent.DELETE_LESSON);
        }
        return showDeletePlan(buildLessonDeletePlan(resolution.value()));
    }

    public CourseAgentResponse planDeleteLesson(Lesson lesson) {
        return showDeletePlan(buildLessonDeletePlan(lesson));
    }

    public CourseAgentResponse planDeleteStep(Course course, CourseIntentResult intent) {
        CourseResolution<Lesson> lessonResolution = entityResolver.resolveLesson(course, intent);
        if (lessonResolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, в каком уроке удалить шаг:",
                    lessonResolution.candidates(),
                    CourseAgentIntent.DELETE_STEP);
        }
        if (!lessonResolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл урок с этим шагом. Уточните модуль и урок.",
                    List.of(),
                    CourseAgentIntent.DELETE_STEP);
        }
        return planDeleteStepInLesson(lessonResolution.value(), intent.stepHint());
    }

    public CourseAgentResponse planDeleteStepById(Long courseId, Long userId, Long stepId) {
        Step step = userAccessService.findStepAndVerifyOwner(userId, stepId);
        planValidator.verifyCourse(
                courseId,
                step.getLesson().getSection().getCourse().getId());
        return showDeletePlan(buildStepDeletePlan(step));
    }

    public CourseAgentResponse planDeleteStepInLesson(Lesson lesson, String stepHint) {
        CourseResolution<Step> stepResolution = entityResolver.resolveStep(lesson.getId(), stepHint);
        if (stepResolution.isAmbiguous()) {
            return CourseAgentResponse.clarify(
                    "Уточните, какой шаг удалить:",
                    stepResolution.candidates(),
                    CourseAgentIntent.DELETE_STEP);
        }
        if (!stepResolution.isFound()) {
            return CourseAgentResponse.clarify(
                    "Не нашёл указанный шаг в выбранном уроке.",
                    List.of(),
                    CourseAgentIntent.DELETE_STEP);
        }
        return showDeletePlan(buildStepDeletePlan(stepResolution.value()));
    }

    public CourseAgentResponse executeDelete(Long courseId, Long userId, CoursePlanDTO plan) {
        planValidator.validate(courseId, userId, plan);

        return switch (plan.getIntent()) {
            case DELETE_SECTION -> {
                sectionService.deleteSection(plan.getTargetSectionId());
                yield CourseAgentResponse.builder()
                        .action(CourseAgentAction.ENTITY_DELETED)
                        .message(String.format(
                                "Модуль «%s» удалён из черновика курса. "
                                        + "Синхронизация со Stepik не выполнялась.",
                                plan.getTargetSectionTitle()))
                        .build();
            }
            case DELETE_LESSON -> {
                lessonService.deleteLesson(plan.getTargetLessonId());
                yield CourseAgentResponse.builder()
                        .action(CourseAgentAction.ENTITY_DELETED)
                        .message(String.format(
                                "Урок «%s» удалён из черновика курса. "
                                        + "Синхронизация со Stepik не выполнялась.",
                                plan.getTargetLessonTitle()))
                        .build();
            }
            case DELETE_STEP -> {
                stepService.deleteStep(plan.getTargetStepId());
                yield CourseAgentResponse.builder()
                        .action(CourseAgentAction.ENTITY_DELETED)
                        .message(String.format(
                                "Шаг «%s» удалён из черновика курса. "
                                        + "Синхронизация со Stepik не выполнялась.",
                                plan.getTargetStepTitle()))
                        .build();
            }
            default -> CourseAgentResponse.error("Этот план нельзя выполнить как удаление");
        };
    }

    public static boolean isDeleteIntent(CourseAgentIntent intent) {
        return intent == CourseAgentIntent.DELETE_SECTION
                || intent == CourseAgentIntent.DELETE_LESSON
                || intent == CourseAgentIntent.DELETE_STEP;
    }

    private CourseAgentResponse showDeletePlan(CoursePlanDTO plan) {
        return CourseAgentResponse.builder()
                .action(CourseAgentAction.SHOW_PLAN)
                .intent(plan.getIntent())
                .message(plan.getMessage())
                .plan(plan)
                .build();
    }

    private CoursePlanDTO buildSectionDeletePlan(Section section) {
        return CoursePlanDTO.builder()
                .intent(CourseAgentIntent.DELETE_SECTION)
                .message(String.format(
                        "Будет удалён модуль «%s» вместе со всеми уроками и шагами внутри.",
                        section.getTitle()))
                .targetSectionId(section.getId())
                .targetSectionTitle(section.getTitle())
                .build();
    }

    private CoursePlanDTO buildLessonDeletePlan(Lesson lesson) {
        Section section = lesson.getSection();
        return CoursePlanDTO.builder()
                .intent(CourseAgentIntent.DELETE_LESSON)
                .message(String.format(
                        "Будет удалён урок «%s» из модуля «%s» вместе со всеми шагами.",
                        lesson.getTitle(),
                        section.getTitle()))
                .targetSectionId(section.getId())
                .targetSectionTitle(section.getTitle())
                .targetLessonId(lesson.getId())
                .targetLessonTitle(lesson.getTitle())
                .build();
    }

    private CoursePlanDTO buildStepDeletePlan(Step step) {
        Lesson lesson = step.getLesson();
        Section section = lesson.getSection();
        String stepTitle = String.format(
                "Шаг %d [%s]",
                step.getPosition(),
                step.getType());
        return CoursePlanDTO.builder()
                .intent(CourseAgentIntent.DELETE_STEP)
                .message(String.format(
                        "Будет удалён %s из урока «%s» (модуль «%s»).",
                        stepTitle,
                        lesson.getTitle(),
                        section.getTitle()))
                .targetSectionId(section.getId())
                .targetSectionTitle(section.getTitle())
                .targetLessonId(lesson.getId())
                .targetLessonTitle(lesson.getTitle())
                .targetStepId(step.getId())
                .targetStepTitle(stepTitle)
                .build();
    }
}
