package org.core.service.agent.course.sse;

public record SseEmitterKey(Long courseId, Long userId, String sessionId) {

    public SseEmitterKey {
        if (courseId == null || userId == null) {
            throw new IllegalArgumentException("courseId and userId are required for SSE key");
        }
        if (sessionId == null || sessionId.isBlank()) {
            throw new IllegalArgumentException("sessionId is required for SSE key");
        }
        sessionId = sessionId.trim();
    }
}
