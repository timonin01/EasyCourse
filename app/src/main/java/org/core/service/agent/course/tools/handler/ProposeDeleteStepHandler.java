package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
import org.core.dto.agent.tools.resolution.ResolvedStep;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CoursePlanValidator;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.DeleteActionMetadataService;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProposeDeleteStepHandler {

    private final UserAccessService userAccessService;
    private final CourseEntityResolver entityResolver;
    private final CoursePlanValidator planValidator;
    private final DeleteActionMetadataService deleteMetadataService;

    public CourseToolResult handleProposeDeleteStep(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        ResolvedLesson lesson = resolveLesson(courseAgentContext, args);
        if (lesson.needsClarification()) {
            return lesson.result();
        }
        if (!lesson.found()) {
            return CourseToolResult.fail("Не нашёл урок для удаления шага.");
        }

        ResolvedStep step = resolveStep(courseAgentContext, lesson.lesson(), args);
        if (step.needsClarification()) {
            return step.result();
        }
        if (!step.found()) {
            return CourseToolResult.fail("Не нашёл указанный шаг в уроке «" + lesson.lesson().getTitle() + "»");
        }

        PlanActionDTO action = deleteMetadataService.prepare(
                courseAgentContext.getUserId(), buildDeleteStepAction(step.step()));
        courseAgentContext.getPendingActions().add(action);
        String ack = "Добавлено в план: удаление шага в уроке «" + lesson.lesson().getTitle() + "»";
        if (Boolean.TRUE.equals(action.getDeleteFromStepik())) {
            ack += ". Будет удалено и на Stepik";
        }
        return CourseToolResult.ok(ack);
    }

    private ResolvedLesson resolveLesson(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long lessonId = ToolArgsHelper.longArg(args, "lessonId");
        if (lessonId != null) {
            Lesson lesson = userAccessService.findLessonAndVerifyOwner(courseAgentContext.getUserId(), lessonId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), lesson.getSection().getCourse().getId());
            return ResolvedLesson.found(lesson);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Lesson> resolution = entityResolver.resolveLesson(courseAgentContext.getCourse(), hints);
        if (resolution.isAmbiguous()) {
            return ResolvedLesson.clarify("Уточните, какой урок имеется в виду:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedLesson.found(resolution.value());
        }
        return ResolvedLesson.notFound();
    }

    private ResolvedStep resolveStep(CourseAgentContext courseAgentContext, Lesson lesson, Map<String, Object> args) {
        Long stepId = ToolArgsHelper.longArg(args, "stepId");
        if (stepId != null) {
            Step step = userAccessService.findStepAndVerifyOwner(courseAgentContext.getUserId(), stepId);
            if (!step.getLesson().getId().equals(lesson.getId())) {
                return ResolvedStep.notFound();
            }
            return ResolvedStep.found(step);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Step> resolution = entityResolver.resolveStep(lesson.getId(), hints.stepHint());
        if (resolution.isAmbiguous()) {
            return ResolvedStep.clarify("Уточните, какой шаг имеется в виду:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedStep.found(resolution.value());
        }
        return ResolvedStep.notFound();
    }

    private static PlanActionDTO buildDeleteStepAction(Step step) {
        Lesson lesson = step.getLesson();
        Section section = lesson.getSection();
        String stepTitle = String.format("Шаг %d [%s]", step.getPosition(), step.getType());
        return PlanActionDTO.builder()
                .type(PlanActionType.DELETE_STEP)
                .targetSectionId(section.getId())
                .targetSectionTitle(section.getTitle())
                .targetLessonId(lesson.getId())
                .targetLessonTitle(lesson.getTitle())
                .targetStepId(step.getId())
                .targetStepTitle(stepTitle)
                .build();
    }
}
