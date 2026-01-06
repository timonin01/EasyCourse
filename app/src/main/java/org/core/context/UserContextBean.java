package org.core.context;

import org.springframework.stereotype.Component;

@Component
public class UserContextBean {
    
    private static final ThreadLocal<Long> userIdHolder = new ThreadLocal<>();
    
    public Long getUserId() {
        return userIdHolder.get();
    }
    
    public void setUserId(Long userId) {
        if (userId != null) {
            userIdHolder.set(userId);
        } else {
            userIdHolder.remove();
        }
    }
    
    public void clear() {
        userIdHolder.remove();
    }

}
