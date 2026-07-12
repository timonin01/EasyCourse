package org.core.enums;

public enum CourseAgentMode {
    ASK,
    AGENT;

    public static CourseAgentMode parse(String value) {
        if (value == null || value.isBlank()) {
            return AGENT;
        }
        String normalized = value.trim().toUpperCase();
        if ("ACT".equals(normalized)) {
            return AGENT;
        }
        return CourseAgentMode.valueOf(normalized);
    }
}
