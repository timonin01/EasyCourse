package org.core.service.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.core.context.UserContextBean;
import org.core.service.security.JwtTokenService;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserContextBean userContextBean;
    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractBearerToken(request.getHeader("Authorization"));
        if (token == null || !jwtTokenService.isValidToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        Long userId = jwtTokenService.getUserIdFromToken(token);
        userContextBean.setUserId(userId);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList())
        );
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        try {
            filterChain.doFilter(request, response);
        } finally {
            userContextBean.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/api/v1/users/login")
                || path.equals("/api/v1/users")
                || path.equals("/api/v1/users/verify-email")
                || path.equals("/api/v1/users/resend-verification")
                || path.equals("/api/v1/users/registration-config")
                || path.equals("/api/v1/users/forgot-password")
                || path.equals("/api/v1/users/verify-reset-code")
                || path.equals("/api/v1/users/reset-password")
                || path.startsWith("/actuator/health");
    }

    private String extractBearerToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authHeader.substring(7).trim();
        return token.isEmpty() ? null : token;
    }
}
