package org.core.aspect;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.core.annotation.RequiresStepikToken;
import org.core.service.StepikTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;

@Aspect
@Component
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
@Slf4j
public class StepikTokenAspect {

    @Value("${stepik.token.aop.enabled}")
    private boolean aopEnabled;

    private final StepikTokenService stepikTokenService;

    @Around("@annotation(org.core.annotation.RequiresStepikToken)")
    public Object checkStepikToken(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!aopEnabled) {
            log.debug("Stepik token AOP is disabled, proceeding with method execution");
            return joinPoint.proceed();
        }
    
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        RequiresStepikToken annotation = method.getAnnotation(RequiresStepikToken.class);
        
        Long userId = extractUserId(joinPoint, annotation);
        if (userId == null) {
            throw new IllegalArgumentException("Could not extract userId from method parameters for method: " + method.getName());
        }        
        try {
            String accessToken = stepikTokenService.getAccessToken(userId);
            if (accessToken == null) {
                throw new RuntimeException("No OAuth configuration found for user: " + userId + ". Please configure Stepik OAuth credentials.");
            }
            return joinPoint.proceed();
            
        } catch (Exception e) {
            log.error("Failed to get Stepik access token for user: {} before executing method: {}", userId, method.getName(), e);
            throw new RuntimeException("Stepik token validation failed for user: " + userId + ". " + e.getMessage(), e);
        }
    }

    private Long extractUserId(ProceedingJoinPoint joinPoint, RequiresStepikToken annotation) {
        Object[] args = joinPoint.getArgs();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Parameter[] parameters = signature.getMethod().getParameters();
        if (annotation.userIdParamIndex() >= 0 && annotation.userIdParamIndex() < args.length) {
            Object userIdArg = args[annotation.userIdParamIndex()];
            if (userIdArg instanceof Long) {
                return (Long) userIdArg;
            }
        }
        if (!annotation.userIdParam().equals("userId")) {
            for (int i = 0; i < parameters.length; i++) {
                if (parameters[i].getName().equals(annotation.userIdParam()) && args[i] instanceof Long) {
                    return (Long) args[i];
                }
            }
        }
        for (int i = 0; i < parameters.length; i++) {
            if (parameters[i].getName().equals("userId") && args[i] instanceof Long) {
                return (Long) args[i];
            }
        }
        for (Object arg : args) {
            if (arg instanceof Long) {
                return (Long) arg;
            }
        }

        return null;
    }
}
