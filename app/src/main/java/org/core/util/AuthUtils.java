package org.core.util;

import org.core.context.UserContextBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class AuthUtils {

    private AuthUtils() {
    }

    public static Long requireCurrentUserId(UserContextBean userContextBean) {
        Long userId = userContextBean.getUserId();
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    public static void requireSameUser(UserContextBean userContextBean, Long requestedUserId) {
        if (!requireCurrentUserId(userContextBean).equals(requestedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
