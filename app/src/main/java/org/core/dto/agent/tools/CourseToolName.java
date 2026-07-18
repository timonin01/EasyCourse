package org.core.dto.agent.tools;

public enum CourseToolName {
    GET_COURSE_STRUCTURE,
    PROPOSE_CREATE_SECTION,
    PROPOSE_CREATE_LESSONS,
    PROPOSE_CREATE_STEPS,
    PROPOSE_DELETE_SECTION,
    PROPOSE_DELETE_LESSON,
    PROPOSE_DELETE_STEP,
    PROPOSE_COPY_STEP,
    PROPOSE_MOVE_STEP,
    PROPOSE_MOVE_LESSON,
    MODIFY_STEP,
    ANSWER_QUESTION,
    FINISH;

    public static CourseToolName parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Tool name is required");
        }
        return CourseToolName.valueOf(value.trim().toUpperCase());
    }

    public boolean isMutationTool() {
        return switch (this) {
            case PROPOSE_CREATE_SECTION, PROPOSE_CREATE_LESSONS, PROPOSE_CREATE_STEPS,
                 PROPOSE_DELETE_SECTION, PROPOSE_DELETE_LESSON, PROPOSE_DELETE_STEP,
                 PROPOSE_COPY_STEP, PROPOSE_MOVE_STEP, PROPOSE_MOVE_LESSON, MODIFY_STEP -> true;
            default -> false;
        };
    }
}
