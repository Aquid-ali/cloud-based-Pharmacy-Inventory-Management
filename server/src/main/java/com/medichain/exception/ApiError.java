package com.medichain.exception;

import org.springframework.http.HttpStatus;

public class ApiError extends RuntimeException {

    private final HttpStatus status;

    public ApiError(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public ApiError(int statusCode, String message) {
        super(message);
        this.status = HttpStatus.valueOf(statusCode);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public int getStatusCode() {
        return status.value();
    }
}
