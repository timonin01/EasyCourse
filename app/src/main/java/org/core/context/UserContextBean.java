package org.core.context;

import lombok.Getter;
import lombok.Setter;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@Scope(value = "request")
public class UserContextBean {
    
    private Long userId;

    public Long getUserIdOrThrow() {
        if (userId == null) {
            throw new IllegalStateException("User ID is not set in UserContextBean. " +
                    "Ensure UserContextBean.setUserId() is called before this method.");
        }
        return userId;
    }
}
