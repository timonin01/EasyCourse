package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
import org.core.dto.agent.tools.resolution.ResolvedStep;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CoursePlanValidator;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.CourseStepModificationService;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ModifyStepHandler {

    private final CourseStepModificationService stepModificationService;
    private final UserAccessService userAccessService;
    private final CoursePlanValidator planValidator;
    private final CourseEntityResolver entityResolver;

    public CourseToolResult handleModifyStep(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        String instruction = ToolArgsHelper.instruction(args, courseAgentContext.getUserInput());
        Long stepId = ToolArgsHelper.longArg(args, "stepId");
        if (stepId != null) {
            return CourseToolResult.immediate(stepModificationService.modifyById(
                    courseAgentContext.getCourse().getId(),
                    courseAgentContext.getUserId(),
                    stepId,
                    courseAgentContext.getSessionId(),
                    instruction,
                    courseAgentContext.getLlmModel(),
                    courseAgentContext.getHistory()));
        }

        ResolvedLesson lesson = resolveLesson(courseAgentContext, args);
        if (lesson.needsClarification()) {
            return lesson.result();
        }
        if (!lesson.found()) {
            return CourseToolResult.fail("Не нашёл урок с этим шагом.");
        }

        ResolvedStep step = resolveStep(courseAgentContext, lesson.lesson(), args);
        if (step.needsClarification()) {
            return step.result();
        }
        if (!step.found()) {
            return CourseToolResult.fail("Не нашёл указанный шаг в выбранном уроке.");
        }

        return CourseToolResult.immediate(stepModificationService.modifyById(
                courseAgentContext.getCourse().getId(),
                courseAgentContext.getUserId(),
                step.step().getId(),
                courseAgentContext.getSessionId(),
                instruction,
                courseAgentContext.getLlmModel(),
                courseAgentContext.getHistory()));
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

}
