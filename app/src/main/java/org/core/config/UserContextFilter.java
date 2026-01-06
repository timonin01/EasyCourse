package org.core.config;

import jakarta.servlet.*;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
@RequiredArgsConstructor
/**
 * Очищаем ThreadLocal после завершения запроса
 * Это важно для предотвращения утечек памяти при переиспользовании потоков из пула
 */
public class UserContextFilter implements Filter {

    private final UserContextBean userContextBean;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        try {
            chain.doFilter(request, response);
        } finally {
            userContextBean.clear();
        }
    }
}

