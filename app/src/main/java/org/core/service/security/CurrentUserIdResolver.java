package org.core.service.security;

import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserIdResolver {

    private final UserContextBean userContextBean;

    public Long requireCurrentUserId() {
        Long userId = resolveCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User is not authenticated");
        }
        return userId;
    }

    public Long resolveCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userId;
        }
        return userContextBean.getUserId();
    }
}
