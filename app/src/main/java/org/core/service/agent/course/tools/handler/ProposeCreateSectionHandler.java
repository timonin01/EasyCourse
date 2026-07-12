package org.core.service.agent.course.tools.handler;

import lombok.RequiredArgsConstructor;
import org.core.domain.Section;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.course.SectionPlanDTO;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CoursePlannerService;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ProposeCreateSectionHandler {

    private final CoursePlannerService plannerService;
    private final CourseEntityResolver entityResolver;

    public CourseToolResult handleProposeCreateSection(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        String instruction = ToolArgsHelper.instruction(args, courseAgentContext.getUserInput());
        List<Section> existingSections = entityResolver.findSectionsMentionedInText(
                courseAgentContext.getCourse().getId(),
                instruction,
                Collections.emptySet());
        if (!existingSections.isEmpty()) {
            Section existing = existingSections.get(0);
            return CourseToolResult.fail(String.format(
                    "Модуль «%s» уже существует. Используй PROPOSE_CREATE_LESSONS для добавления уроков со шагами.",
                    existing.getTitle()));
        }

        SectionPlanDTO sectionPlan = plannerService.planSection(
                courseAgentContext.getCourseSnapshot(), instruction, courseAgentContext.getLlmModel(), courseAgentContext.getHistory());

        courseAgentContext.getPendingActions().add(PlanActionDTO.builder()
                .type(PlanActionType.CREATE_SECTION)
                .section(sectionPlan)
                .build());
        return CourseToolResult.ok("Добавлен в план: модуль «" + sectionPlan.getTitle() + "»");
    }

}
