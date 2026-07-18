package org.core.service.agent.course.tools.util;

import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public final class CoursePlanHelper {

    public boolean hasDeleteActions(List<PlanActionDTO> actions) {
        if (actions == null) {
            return false;
        }
        return actions.stream().anyMatch(action -> isDeleteAction(action.getType()));
    }

    public boolean isDeleteAction(PlanActionType type) {
        return type == PlanActionType.DELETE_SECTION
                || type == PlanActionType.DELETE_LESSON
                || type == PlanActionType.DELETE_STEP;
    }

    public boolean isCreateAction(PlanActionType type) {
        return type == PlanActionType.CREATE_SECTION
                || type == PlanActionType.CREATE_LESSONS
                || type == PlanActionType.CREATE_STEPS
                || type == PlanActionType.COPY_STEP
                || type == PlanActionType.MOVE_STEP
                || type == PlanActionType.MOVE_LESSON;
    }
}
