package org.core.exception.exceptions;

public class PromptLengthExceededException extends RuntimeException {

    public PromptLengthExceededException(String message) {
        super(message);
    }
}
