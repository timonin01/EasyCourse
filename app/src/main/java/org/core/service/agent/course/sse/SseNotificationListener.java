package org.core.service.agent.course.sse;

import lombok.RequiredArgsConstructor;
import org.core.dto.agent.course.sse.PlanExecutionEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SseNotificationListener {

    private final SseNotificationService sseNotificationService;

    @EventListener
    public void handleExecutionEvent(PlanExecutionEvent planExecutionEvent){
        sseNotificationService.sendNotification(planExecutionEvent);
    }

}
