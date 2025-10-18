package org.core.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class OAuthConfigChangedEvent extends ApplicationEvent {
    
    private final Long userId;
    
    public OAuthConfigChangedEvent(Object source, Long userId) {
        super(source);
        this.userId = userId;
    }
}
