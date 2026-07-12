package org.core.service.agent.course.util;

import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.PlanActionType;
import org.core.dto.agent.course.SectionPlanDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public final class StepsCounter {

    public int countPlannedSteps(CoursePlanDTO plan) {
        if (plan == null || plan.getActions() == null) {
            return 0;
        }
        int total = 0;
        for (PlanActionDTO action : plan.getActions()) {
            total += countActionSteps(action);
        }
        return total;
    }

    private int countActionSteps(PlanActionDTO action) {
        if (action == null || action.getType() == null) {
            return 0;
        }
        return switch (action.getType()) {
            case CREATE_SECTION -> countSectionSteps(action.getSection());
            case CREATE_LESSONS -> countLessonSteps(action.getLessons());
            case CREATE_STEPS -> countSteps(action.getSteps());
            default -> 0;
        };
    }

    private int countSectionSteps(SectionPlanDTO section) {
        return section == null ? 0 : countLessonSteps(section.getLessons());
    }

    private int countLessonSteps(List<LessonPlanDTO> lessons) {
        if (lessons == null) {
            return 0;
        }
        int total = 0;
        for (LessonPlanDTO lesson : lessons) {
            total += countSteps(lesson == null ? null : lesson.getSteps());
        }
        return total;
    }

    private int countSteps(List<CountStepDTO> steps) {
        if (steps == null) {
            return 0;
        }
        return steps.stream()
                .mapToInt(s -> s.getCount() == null || s.getCount() < 1 ? 1 : s.getCount())
                .sum();
    }
}
