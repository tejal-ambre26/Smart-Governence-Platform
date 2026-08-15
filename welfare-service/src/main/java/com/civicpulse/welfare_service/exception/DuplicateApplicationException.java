package com.civicpulse.welfare_service.exception;

public class DuplicateApplicationException extends RuntimeException {
    private final Object existingApplication;

    public DuplicateApplicationException(String message, Object existingApplication) {
        super(message);
        this.existingApplication = existingApplication;
    }

    public Object getExistingApplication() {
        return existingApplication;
    }
}
