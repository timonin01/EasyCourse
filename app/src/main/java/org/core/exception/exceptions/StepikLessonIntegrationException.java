package org.core.exception.exceptions;

public class StepikLessonIntegrationException extends RuntimeException {
    
    public StepikLessonIntegrationException(String message) {
        super(message);
    }
    
    public StepikLessonIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
