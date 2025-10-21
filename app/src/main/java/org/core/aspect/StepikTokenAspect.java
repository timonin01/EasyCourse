package org.core.aspect;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.core.context.UserContextBean;
import org.core.service.StepikTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class StepikTokenAspect {

    @Value("${stepik.token.aop.enabled}")
    private boolean aopEnabled;

    private final StepikTokenService stepikTokenService;
    private final UserContextBean userContextBean;

    @Around("@annotation(org.core.annotation.RequiresStepikToken)")
    public Object checkStepikToken(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!aopEnabled) {
            log.debug("Stepik token AOP is disabled, proceeding with method execution");
            return joinPoint.proceed();
        }
        Long userId = userContextBean.getUserId();
        
        if (userId == null) {
            throw new RuntimeException("User ID not found in UserContextBean. " +
                    "Ensure UserContextBean.setUserId() is called before this method.");
        }
        try {
            String accessToken = stepikTokenService.getAccessToken(userId);
            if (accessToken == null) {
                throw new RuntimeException("No OAuth configuration found for user: " + userId + 
                        ". Please configure Stepik OAuth credentials.");
            }
            
            return joinPoint.proceed();
        } catch (Exception e) {
            log.error("Failed to get Stepik access token for user: {} before executing method: {}", 
                    userId, joinPoint.getSignature().getName(), e);
            throw new RuntimeException("Stepik token validation failed for user: " + userId + ". " + e.getMessage(), e);
        }
    }
}