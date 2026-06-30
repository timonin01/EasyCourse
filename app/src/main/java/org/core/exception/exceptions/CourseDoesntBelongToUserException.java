package org.core.exception.exceptions;

public class CourseDoesntBelongToUserException extends RuntimeException {
    public CourseDoesntBelongToUserException(String message) {
        super(message);
    }
}
