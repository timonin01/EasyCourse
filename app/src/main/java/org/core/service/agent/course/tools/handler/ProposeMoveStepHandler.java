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
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProposeMoveStepHandler {

    private final UserAccessService userAccessService;
    private final CourseEntityResolver entityResolver;
    private final CoursePlanValidator planValidator;

    public CourseToolResult handleProposeMoveStep(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        ResolvedLesson sourceLesson = resolveSourceLesson(courseAgentContext, args);
        if (sourceLesson.needsClarification()) {
            return sourceLesson.result();
        }
        if (!sourceLesson.found()) {
            return CourseToolResult.fail("Не нашёл урок с исходным шагом для перемещения.");
        }

        ResolvedStep sourceStep = resolveSourceStep(courseAgentContext, sourceLesson.lesson(), args);
        if (sourceStep.needsClarification()) {
            return sourceStep.result();
        }
        if (!sourceStep.found()) {
            return CourseToolResult.fail("Не нашёл исходный шаг в уроке «" + sourceLesson.lesson().getTitle() + "».");
        }

        ResolvedLesson targetLesson = resolveTargetLesson(courseAgentContext, args);
        if (targetLesson.needsClarification()) {
            return targetLesson.result();
        }
        if (!targetLesson.found()) {
            return CourseToolResult.fail("Не нашёл урок назначения. Укажи targetLessonHint (куда переместить).");
        }

        if (sourceLesson.lesson().getId().equals(targetLesson.lesson().getId())) {
            return CourseToolResult.fail("Нельзя переместить шаг в тот же урок — укажи другой targetLessonHint.");
        }

        if (sourceStep.step().getStepikBlockData() == null || sourceStep.step().getStepikBlockData().isBlank()) {
            return CourseToolResult.fail("У выбранного шага нет содержимого для перемещения (пустой stepikBlockData).");
        }

        boolean alreadyPlanned = courseAgentContext.getPendingActions().stream()
                .anyMatch(action -> action != null
                        && action.getType() == PlanActionType.MOVE_STEP
                        && sourceStep.step().getId().equals(action.getTargetStepId())
                        && targetLesson.lesson().getId().equals(action.getTargetLessonId()));
        if (alreadyPlanned) {
            return CourseToolResult.ok(
                    "Перемещение этого шага в урок «" + targetLesson.lesson().getTitle() + "» уже есть в плане. Вызови FINISH.");
        }

        PlanActionDTO action = buildMoveStepAction(sourceStep.step(), sourceLesson.lesson(), targetLesson.lesson());
        courseAgentContext.getPendingActions().add(action);

        String stepikNote = Boolean.TRUE.equals(action.getDeleteFromStepik())
                ? " Исходный шаг будет удалён и на Stepik."
                : " Исходный шаг будет удалён локально.";
        return CourseToolResult.ok(String.format(
                "Добавлено в план: перемещение шага %d [%s] из «%s» → урок «%s».%s Новый шаг появится в конце урока и не будет синхронизирован со Stepik автоматически.",
                sourceStep.step().getPosition(),
                sourceStep.step().getType(),
                sourceLesson.lesson().getTitle(),
                targetLesson.lesson().getTitle(),
                stepikNote));
    }

    private ResolvedLesson resolveSourceLesson(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long lessonId = ToolArgsHelper.longArg(args, "lessonId");
        if (lessonId != null) {
            Lesson lesson = userAccessService.findLessonAndVerifyOwner(courseAgentContext.getUserId(), lessonId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), lesson.getSection().getCourse().getId());
            return ResolvedLesson.found(lesson);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Lesson> resolution = entityResolver.resolveLesson(courseAgentContext.getCourse(), hints);
        if (resolution.isAmbiguous()) {
            return ResolvedLesson.clarify("Уточните исходный урок (где лежит шаг):", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedLesson.found(resolution.value());
        }
        return ResolvedLesson.notFound();
    }

    private ResolvedStep resolveSourceStep(CourseAgentContext courseAgentContext, Lesson lesson, Map<String, Object> args) {
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
            return ResolvedStep.clarify("Уточните, какой шаг переместить:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedStep.found(resolution.value());
        }
        return ResolvedStep.notFound();
    }

    private ResolvedLesson resolveTargetLesson(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long targetLessonId = ToolArgsHelper.longArg(args, "targetLessonId");
        if (targetLessonId != null) {
            Lesson lesson = userAccessService.findLessonAndVerifyOwner(courseAgentContext.getUserId(), targetLessonId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), lesson.getSection().getCourse().getId());
            return ResolvedLesson.found(lesson);
        }

        String targetSectionHint = firstNonBlank(
                ToolArgsHelper.stringArg(args, "targetSectionHint"),
                ToolArgsHelper.stringArg(args, "sectionHint"));
        String targetLessonHint = firstNonBlank(
                ToolArgsHelper.stringArg(args, "targetLessonHint"),
                ToolArgsHelper.stringArg(args, "destLessonHint"));

        if (targetLessonHint == null || targetLessonHint.isBlank()) {
            return ResolvedLesson.notFound();
        }

        EntityHints targetHints = new EntityHints(targetSectionHint, targetLessonHint, null);
        CourseResolution<Lesson> resolution = entityResolver.resolveLesson(courseAgentContext.getCourse(), targetHints);
        if (resolution.isAmbiguous()) {
            return ResolvedLesson.clarify("Уточните урок, куда переместить шаг:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedLesson.found(resolution.value());
        }
        return ResolvedLesson.notFound();
    }

    private static PlanActionDTO buildMoveStepAction(Step sourceStep, Lesson sourceLesson, Lesson targetLesson) {
        Section targetSection = targetLesson.getSection();
        String stepTitle = String.format("Шаг %d [%s]", sourceStep.getPosition(), sourceStep.getType());
        return PlanActionDTO.builder()
                .type(PlanActionType.MOVE_STEP)
                .sourceLessonId(sourceLesson.getId())
                .sourceLessonTitle(sourceLesson.getTitle())
                .sourceSectionId(sourceLesson.getSection().getId())
                .sourceSectionTitle(sourceLesson.getSection().getTitle())
                .targetSectionId(targetSection.getId())
                .targetSectionTitle(targetSection.getTitle())
                .targetLessonId(targetLesson.getId())
                .targetLessonTitle(targetLesson.getTitle())
                .targetStepId(sourceStep.getId())
                .targetStepTitle(stepTitle)
                .deleteFromStepik(sourceStep.getStepikStepId() != null)
                .build();
    }

    private static String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }
}
