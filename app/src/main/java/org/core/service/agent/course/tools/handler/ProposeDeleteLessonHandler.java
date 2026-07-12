package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Lesson;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedLesson;
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
public class ProposeDeleteLessonHandler {

    private final UserAccessService userAccessService;
    private final CoursePlanValidator planValidator;
    private final CourseEntityResolver entityResolver;
    private final DeleteActionMetadataService deleteMetadataService;

    public CourseToolResult handleProposeDeleteLesson(CourseAgentContext ctx, Map<String, Object> args) {
        ResolvedLesson lesson = resolveLesson(ctx, args);
        if (lesson.needsClarification()) {
            return lesson.result();
        }
        if (!lesson.found()) {
            return CourseToolResult.fail("Не нашёл урок для удаления.");
        }
        Lesson target = lesson.lesson();
        PlanActionDTO action = deleteMetadataService.prepare(ctx.getUserId(), PlanActionDTO.builder()
                .type(PlanActionType.DELETE_LESSON)
                .targetSectionId(target.getSection().getId())
                .targetSectionTitle(target.getSection().getTitle())
                .targetLessonId(target.getId())
                .targetLessonTitle(target.getTitle())
                .build());
        ctx.getPendingActions().add(action);
        return CourseToolResult.ok(buildAckMessage(action, target.getTitle()));
    }

    private String buildAckMessage(PlanActionDTO action, String title) {
        StringBuilder msg = new StringBuilder("Добавлено в план: удаление урока «").append(title).append('»');
        int steps = action.getCascadeStepCount() != null ? action.getCascadeStepCount() : 0;
        if (steps > 0) {
            msg.append(" (каскадно: ").append(steps).append(" шаг.)");
        }
        if (Boolean.TRUE.equals(action.getDeleteFromStepik())) {
            msg.append(". Будет удалено и на Stepik");
        }
        return msg.toString();
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
}
