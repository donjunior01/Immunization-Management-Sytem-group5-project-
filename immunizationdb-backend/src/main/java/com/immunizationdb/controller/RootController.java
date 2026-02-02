package com.immunizationdb.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "VaxTrack Immunization Management System");
        response.put("status", "RUNNING");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now());
        response.put("api_base", "/api");
        response.put("endpoints", Map.of(
            "health", "/api/actuator/health",
            "login", "/api/auth/login",
            "register", "/api/auth/register"
        ));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "VaxTrack Backend");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}