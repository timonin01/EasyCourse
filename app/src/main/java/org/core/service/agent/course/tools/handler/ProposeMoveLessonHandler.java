package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
import org.core.dto.agent.tools.resolution.ResolvedSection;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CoursePlanValidator;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProposeMoveLessonHandler {

    private final UserAccessService userAccessService;
    private final CourseEntityResolver entityResolver;
    private final CoursePlanValidator planValidator;

    public CourseToolResult handleProposeMoveLesson(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        ResolvedLesson sourceLesson = resolveSourceLesson(courseAgentContext, args);
        if (sourceLesson.needsClarification()) {
            return sourceLesson.result();
        }
        if (!sourceLesson.found()) {
            return CourseToolResult.fail("Не нашёл урок для перемещения.");
        }

        ResolvedSection targetSection = resolveTargetSection(courseAgentContext, args);
        if (targetSection.needsClarification()) {
            return targetSection.result();
        }
        if (!targetSection.found()) {
            return CourseToolResult.fail("Не нашёл модуль назначения. Укажи targetSectionHint (куда переместить).");
        }

        Lesson lesson = sourceLesson.lesson();
        Section destination = targetSection.section();
        if (lesson.getSection().getId().equals(destination.getId())) {
            return CourseToolResult.fail("Нельзя переместить урок в тот же модуль — укажи другой targetSectionHint.");
        }

        boolean alreadyPlanned = courseAgentContext.getPendingActions().stream()
                .anyMatch(action -> action != null
                        && action.getType() == PlanActionType.MOVE_LESSON
                        && lesson.getId().equals(action.getTargetLessonId())
                        && destination.getId().equals(action.getTargetSectionId()));
        if (alreadyPlanned) {
            return CourseToolResult.ok(
                    "Перемещение урока «" + lesson.getTitle() + "» в модуль «" + destination.getTitle()
                            + "» уже есть в плане. Вызови FINISH.");
        }

        PlanActionDTO action = buildMoveLessonAction(lesson, destination);
        courseAgentContext.getPendingActions().add(action);

        String stepikNote = Boolean.TRUE.equals(action.getDeleteFromStepik())
                ? " Исходный урок (и его шаги на Stepik) будет удалён со Stepik."
                : " Исходный урок будет удалён локально.";
        return CourseToolResult.ok(String.format(
                "Добавлено в план: перемещение урока «%s» из модуля «%s» → модуль «%s».%s Копия появится в конце модуля и не будет синхронизирована со Stepik автоматически.",
                lesson.getTitle(),
                lesson.getSection().getTitle(),
                destination.getTitle(),
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
            return ResolvedLesson.clarify("Уточните, какой урок переместить:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedLesson.found(resolution.value());
        }
        return ResolvedLesson.notFound();
    }

    private ResolvedSection resolveTargetSection(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long targetSectionId = ToolArgsHelper.longArg(args, "targetSectionId");
        if (targetSectionId != null) {
            Section section = userAccessService.findSectionAndVerifyOwner(courseAgentContext.getUserId(), targetSectionId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), section.getCourse().getId());
            return ResolvedSection.found(section);
        }

        String targetSectionHint = firstNonBlank(
                ToolArgsHelper.stringArg(args, "targetSectionHint"),
                ToolArgsHelper.stringArg(args, "destSectionHint"));
        if (targetSectionHint == null || targetSectionHint.isBlank()) {
            return ResolvedSection.notFound();
        }

        CourseResolution<Section> resolution = entityResolver.resolveSection(
                courseAgentContext.getCourse().getId(), targetSectionHint);
        if (resolution.isAmbiguous()) {
            return ResolvedSection.clarify("Уточните модуль, куда переместить урок:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedSection.found(resolution.value());
        }
        return ResolvedSection.notFound();
    }

    private static PlanActionDTO buildMoveLessonAction(Lesson sourceLesson, Section targetSection) {
        boolean synced = sourceLesson.getStepikLessonId() != null
                || sourceLesson.getSteps().stream().anyMatch(step -> step.getStepikStepId() != null);
        return PlanActionDTO.builder()
                .type(PlanActionType.MOVE_LESSON)
                .sourceSectionId(sourceLesson.getSection().getId())
                .sourceSectionTitle(sourceLesson.getSection().getTitle())
                .targetLessonId(sourceLesson.getId())
                .targetLessonTitle(sourceLesson.getTitle())
                .targetSectionId(targetSection.getId())
                .targetSectionTitle(targetSection.getTitle())
                .deleteFromStepik(synced)
                .cascadeStepCount(sourceLesson.getSteps() == null ? 0 : sourceLesson.getSteps().size())
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
