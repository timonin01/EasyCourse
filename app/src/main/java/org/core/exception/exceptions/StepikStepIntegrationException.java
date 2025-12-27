package org.core.exception.exceptions;

public class StepikStepIntegrationException extends RuntimeException {

    public StepikStepIntegrationException(String message) {
        super(message);
    }

    public StepikStepIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
