package com.immunizationdb.auth.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        log.error("Validation failed: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        log.error("RuntimeException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("Access denied for user: {}, authorities: {}, error: {}", 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null 
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName() 
                : "unknown",
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication() != null 
                ? org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities() 
                : "none",
            ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden: Insufficient permissions");
    }
}
