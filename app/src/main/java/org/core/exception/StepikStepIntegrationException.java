package org.core.exception;

public class StepikStepIntegrationException extends RuntimeException {

    public StepikStepIntegrationException(String message) {
        super(message);
    }

    public StepikStepIntegrationException(String message, Throwable cause) {
        super(message, cause);
    }
}
