package org.core.service.agent.course.sse;

import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.course.sse.PlanExecutionEvent;
import org.core.dto.agent.course.sse.PlanExecutionEventType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class SseNotificationService {

    @Value("${course.sse.connection.timeout}")
    private Long connectionTimeout;

    private final Map<SseEmitterKey, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long courseId, Long userId, String sessionId) {
        SseEmitterKey key = new SseEmitterKey(courseId, userId, sessionId);
        SseEmitter previous = emitters.remove(key);
        if (previous != null) {
            previous.complete();
        }

        SseEmitter emitter = new SseEmitter(connectionTimeout);
        emitter.onCompletion(() -> emitters.remove(key, emitter));
        emitter.onTimeout(() -> {
            emitters.remove(key, emitter);
            emitter.complete();
        });
        emitter.onError(e -> emitters.remove(key, emitter));

        emitters.put(key, emitter);
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected successfully"));
        } catch (IOException e) {
            emitters.remove(key, emitter);
            emitter.completeWithError(e);
        }
        return emitter;
    }

    public void sendNotification(PlanExecutionEvent event) {
        if (event == null || event.getCourseId() == null || event.getUserId() == null || event.getSessionId() == null || event.getSessionId().isBlank()) {
            log.error("Skip SSE notification: missing courseId/userId/sessionId");
            return;
        }
        SseEmitterKey key = new SseEmitterKey(event.getCourseId(), event.getUserId(), event.getSessionId());
        SseEmitter emitter = emitters.get(key);
        if (emitter == null) {
            return;
        }
        try {
            emitter.send(SseEmitter.event()
                    .name("progress")
                    .data(event));
            if (event.getPlanExecutionEventType() == PlanExecutionEventType.DONE || event.getPlanExecutionEventType() == PlanExecutionEventType.ERROR) {
                emitters.remove(key, emitter);
                emitter.complete();
            }
        } catch (IOException e) {
            log.debug("SSE client disconnected for {}: {}", key, e.getMessage());
            emitters.remove(key, emitter);
            emitter.completeWithError(e);
        }
    }
}
