package org.core.service.agent.course.tools.util;

import org.core.dto.agent.course.PlanActionDTO;
import org.core.dto.agent.course.SectionPlanDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

@Component
public final class CoursePlanMessageBuilder {

    private static final Pattern INTERNAL_HINT_PATTERN = Pattern.compile(
            "\\s*\\((?:section|lesson|step)(?:Hint)?\\s*:?\\s*[^)]*\\)",
            Pattern.CASE_INSENSITIVE);

    public String sanitizeUserFacingMessage(String message) {
        if (message == null || message.isBlank()) {
            return message;
        }
        String cleaned = INTERNAL_HINT_PATTERN.matcher(message).replaceAll("");
        cleaned = cleaned.replaceAll("[ \\t]{2,}", " ").trim();
        return cleaned.isEmpty() ? message.trim() : cleaned;
    }

    public String buildSummary(List<PlanActionDTO> actions) {
        if (actions == null || actions.isEmpty()) {
            return "План пуст.";
        }
        int sections = 0;
        int lessons = 0;
        int steps = 0;
        int copies = 0;
        int moves = 0;
        int deletes = 0;

        for (PlanActionDTO action : actions) {
            if (action == null || action.getType() == null) {
                continue;
            }
            switch (action.getType()) {
                case CREATE_SECTION -> {
                    sections++;
                    lessons += countLessons(action.getSection());
                    steps += countSectionSteps(action.getSection());
                }
                case CREATE_LESSONS -> {
                    lessons += countPlanLessons(action.getLessons());
                    steps += countLessonPlanSteps(action.getLessons());
                }
                case CREATE_STEPS -> steps += countSteps(action.getSteps());
                case COPY_STEP -> copies++;
                case MOVE_STEP, MOVE_LESSON -> moves++;
                case DELETE_SECTION, DELETE_LESSON, DELETE_STEP -> deletes++;
                default -> {
                }
            }
        }

        boolean stepikDeletes = false;
        int cascadeLessons = 0;
        int cascadeSteps = 0;
        for (PlanActionDTO action : actions) {
            if (action == null || action.getType() == null) {
                continue;
            }
            if (action.getType() == org.core.dto.agent.course.PlanActionType.DELETE_SECTION
                    || action.getType() == org.core.dto.agent.course.PlanActionType.DELETE_LESSON
                    || action.getType() == org.core.dto.agent.course.PlanActionType.DELETE_STEP) {
                if (Boolean.TRUE.equals(action.getDeleteFromStepik())) {
                    stepikDeletes = true;
                }
                cascadeLessons += action.getCascadeLessonCount() != null ? action.getCascadeLessonCount() : 0;
                cascadeSteps += action.getCascadeStepCount() != null ? action.getCascadeStepCount() : 0;
            }
        }

        StringBuilder message = new StringBuilder("План:");
        if (sections > 0) {
            message.append(" создать ").append(sections).append(" модул(ей)");
        }
        if (lessons > 0) {
            message.append(sections > 0 ? "," : "").append(" добавить ").append(lessons).append(" урок(ов)");
        }
        if (steps > 0) {
            message.append(" добавить ").append(steps).append(" шаг(ов)");
        }
        if (copies > 0) {
            message.append(sections + lessons + steps > 0 ? "," : "")
                    .append(" скопировать ").append(copies).append(" шаг(ов)");
        }
        if (moves > 0) {
            message.append(sections + lessons + steps + copies > 0 ? "," : "")
                    .append(" переместить ").append(moves).append(" элемент(ов)");
        }
        if (deletes > 0) {
            message.append(" удалить ").append(deletes).append(" элемент(ов)");
            if (cascadeLessons > 0 || cascadeSteps > 0) {
                message.append(" (каскад: ").append(cascadeLessons).append(" урок., ").append(cascadeSteps).append(" шаг.)");
            }
            if (stepikDeletes) {
                message.append(" — также на Stepik");
            }
        }
        message.append(".");
        return message.toString();
    }

    private int countLessons(SectionPlanDTO section) {
        return section == null || section.getLessons() == null ? 0 : section.getLessons().size();
    }

    private int countSectionSteps(SectionPlanDTO section) {
        if (section == null || section.getLessons() == null) {
            return 0;
        }
        return countLessonPlanSteps(section.getLessons());
    }

    private int countPlanLessons(List<org.core.dto.agent.course.LessonPlanDTO> lessons) {
        return lessons == null ? 0 : lessons.size();
    }

    private int countLessonPlanSteps(List<org.core.dto.agent.course.LessonPlanDTO> lessons) {
        if (lessons == null) {
            return 0;
        }
        int total = 0;
        for (var lesson : lessons) {
            total += countSteps(lesson == null ? null : lesson.getSteps());
        }
        return total;
    }

    private int countSteps(List<org.core.dto.agent.batchAnalyzer.CountStepDTO> steps) {
        if (steps == null) {
            return 0;
        }
        return steps.stream()
                .mapToInt(step -> step == null || step.getCount() == null || step.getCount() < 1 ? 1 : step.getCount())
                .sum();
    }
}
