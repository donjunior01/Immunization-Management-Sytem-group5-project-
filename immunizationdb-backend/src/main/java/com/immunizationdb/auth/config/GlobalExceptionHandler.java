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
        // #region agent log
        try {
            StringBuilder errorsJson = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, String> entry : errors.entrySet()) {
                if (!first) errorsJson.append(",");
                errorsJson.append("\"").append(entry.getKey()).append("\":\"").append(entry.getValue().replace("\"", "\\\"")).append("\"");
                first = false;
            }
            errorsJson.append("}");
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"GlobalExceptionHandler.java:handleValidationExceptions\",\"message\":\"Validation error\",\"data\":{\"errors\":%s,\"targetClass\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"APPOINTMENT_UPDATE\"}\n", 
                errorsJson.toString(), ex.getTarget() != null ? ex.getTarget().getClass().getSimpleName() : "unknown", System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        log.error("Validation failed: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException ex) {
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"GlobalExceptionHandler.java:38\",\"message\":\"RuntimeException caught\",\"data\":{\"message\":\"%s\",\"class\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"VACCINATION_ERROR\"}\n", 
                ex.getMessage().replace("\"", "\\\""), ex.getClass().getSimpleName(), System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        log.error("RuntimeException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDeniedException(AccessDeniedException ex) {
        System.out.println("[DEBUG] GlobalExceptionHandler.handleAccessDeniedException called: " + ex.getMessage());
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "null";
            String authorities = auth != null ? auth.getAuthorities().toString() : "null";
            String principalClass = auth != null && auth.getPrincipal() != null ? auth.getPrincipal().getClass().getSimpleName() : "null";
            boolean isEnabled = false;
            boolean isAccountNonLocked = false;
            boolean isAuthenticated = auth != null && auth.isAuthenticated();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal();
                isEnabled = userDetails.isEnabled();
                isAccountNonLocked = userDetails.isAccountNonLocked();
            }
            // Check if authorities contain expected roles
            boolean hasHealthWorker = authorities.contains("ROLE_HEALTH_WORKER");
            boolean hasFacilityManager = authorities.contains("ROLE_FACILITY_MANAGER");
            boolean hasGovernmentOfficial = authorities.contains("ROLE_GOVERNMENT_OFFICIAL");
            System.out.println("[DEBUG] AccessDenied - username: " + username + ", authorities: " + authorities + ", isEnabled: " + isEnabled);
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"GlobalExceptionHandler.java:15\",\"message\":\"AccessDeniedException caught\",\"data\":{\"hasAuth\":%s,\"isAuthenticated\":%s,\"username\":\"%s\",\"authorities\":\"%s\",\"principalClass\":\"%s\",\"isEnabled\":%s,\"isAccountNonLocked\":%s,\"hasHealthWorker\":%s,\"hasFacilityManager\":%s,\"hasGovernmentOfficial\":%s,\"message\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"C\"}\n", 
                auth != null, isAuthenticated, username, authorities, principalClass, isEnabled, isAccountNonLocked, hasHealthWorker, hasFacilityManager, hasGovernmentOfficial, ex.getMessage()));
            fw.close();
            System.out.println("[DEBUG] Log written successfully for AccessDeniedException");
        } catch (Exception e) {
            System.err.println("[DEBUG] LOG ERROR in GlobalExceptionHandler: " + e.getMessage());
            e.printStackTrace();
        }
        // #endregion
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


