package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Section;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.dto.agent.tools.resolution.ResolvedSection;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.DeleteActionMetadataService;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.CoursePlanValidator;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.util.UserAccessService;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProposeDeleteSectionHandler {

    private final UserAccessService userAccessService;
    private final CoursePlanValidator planValidator;
    private final CourseEntityResolver entityResolver;
    private final DeleteActionMetadataService deleteMetadataService;

    public CourseToolResult handleProposeDeleteSection(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        ResolvedSection section = resolveSection(courseAgentContext, args);
        if (section.needsClarification()) {
            return section.result();
        }
        if (!section.found()) {
            return CourseToolResult.fail("Не нашёл модуль для удаления.");
        }
        PlanActionDTO action = deleteMetadataService.prepare(courseAgentContext.getUserId(), PlanActionDTO.builder()
                .type(PlanActionType.DELETE_SECTION)
                .targetSectionId(section.section().getId())
                .targetSectionTitle(section.section().getTitle())
                .build());
        courseAgentContext.getPendingActions().add(action);
        return CourseToolResult.ok(buildAckMessage(action, section.section().getTitle()));
    }

    private String buildAckMessage(PlanActionDTO action, String title) {
        StringBuilder msg = new StringBuilder("Добавлено в план: удаление модуля «").append(title).append('»');
        appendCascadeHint(msg, action);
        return msg.toString();
    }

    private void appendCascadeHint(StringBuilder msg, PlanActionDTO action) {
        int lessons = action.getCascadeLessonCount() != null ? action.getCascadeLessonCount() : 0;
        int steps = action.getCascadeStepCount() != null ? action.getCascadeStepCount() : 0;
        if (lessons > 0 || steps > 0) {
            msg.append(" (каскадно: ").append(lessons).append(" урок., ").append(steps).append(" шаг.)");
        }
        if (Boolean.TRUE.equals(action.getDeleteFromStepik())) {
            msg.append(". Будет удалено и на Stepik");
        }
    }

    private ResolvedSection resolveSection(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        Long sectionId = ToolArgsHelper.longArg(args, "sectionId");
        if (sectionId != null) {
            Section section = userAccessService.findSectionAndVerifyOwner(courseAgentContext.getUserId(), sectionId);
            planValidator.verifyCourse(courseAgentContext.getCourse().getId(), section.getCourse().getId());
            return ResolvedSection.found(section);
        }
        EntityHints hints = EntityHints.fromArgs(args);
        CourseResolution<Section> resolution = entityResolver.resolveSection(courseAgentContext.getCourse().getId(), hints.sectionHint());
        if (resolution.isAmbiguous()) {
            return ResolvedSection.clarify("Уточните, какой модуль имеется в виду:", resolution.candidates());
        }
        if (resolution.isFound()) {
            return ResolvedSection.found(resolution.value());
        }
        return ResolvedSection.notFound();
    }

}
