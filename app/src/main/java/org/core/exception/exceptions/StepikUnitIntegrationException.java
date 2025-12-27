package org.core.exception.exceptions;

public class StepikUnitIntegrationException extends RuntimeException {
    
    public StepikUnitIntegrationException(String message) {
        super(message);
    }
    
    public StepikUnitIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
