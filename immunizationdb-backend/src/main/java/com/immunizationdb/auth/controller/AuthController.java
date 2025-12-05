package com.immunizationdb.auth.controller;

import com.immunizationdb.auth.dto.*;
import com.immunizationdb.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    private final AuthService authService;

    /**
     * User Story 1.1: Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(buildErrorResponse("Invalid username or password", HttpStatus.UNAUTHORIZED.value(), "/api/auth/login"));
        } catch (LockedException e) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(buildErrorResponse(e.getMessage(), HttpStatus.FORBIDDEN.value(), "/api/auth/login"));
        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse("An error occurred during login", HttpStatus.INTERNAL_SERVER_ERROR.value(), "/api/auth/login"));
        }
    }

    /**
     * Register new user (for future use)
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            UserResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value(), "/api/auth/register"));
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse("An error occurred during registration", HttpStatus.INTERNAL_SERVER_ERROR.value(), "/api/auth/register"));
        }
    }

    /**
     * Refresh JWT token
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            LoginResponse response = authService.refreshToken(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(buildErrorResponse("Invalid or expired token", HttpStatus.UNAUTHORIZED.value(), "/api/auth/refresh"));
        } catch (Exception e) {
            log.error("Token refresh error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse("An error occurred during token refresh", HttpStatus.INTERNAL_SERVER_ERROR.value(), "/api/auth/refresh"));
        }
    }

    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Return current user info
            return ResponseEntity.ok(userDetails);
        } catch (Exception e) {
            log.error("Error fetching profile", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse("An error occurred", HttpStatus.INTERNAL_SERVER_ERROR.value(), "/api/auth/profile"));
        }
    }

    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        try {
            // Extract user ID from UserDetails (assuming it's a User entity)
            Long userId = ((com.immunizationdb.auth.entity.User) userDetails).getId();
            UserResponse response = authService.updateProfile(String.valueOf(userId), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(buildErrorResponse(e.getMessage(), HttpStatus.BAD_REQUEST.value(), "/api/auth/profile"));
        } catch (Exception e) {
            log.error("Profile update error", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildErrorResponse("An error occurred during profile update", HttpStatus.INTERNAL_SERVER_ERROR.value(), "/api/auth/profile"));
        }
    }

    /**
     * Logout endpoint (client-side token deletion, optional server-side tracking)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        if (authentication != null) {
            log.info("User {} logged out", authentication.getName());
        }
        return ResponseEntity.ok().body(new MessageResponse("Logged out successfully"));
    }

    /**
     * Health check endpoint
     * GET /api/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(new MessageResponse("Authentication service is running"));
    }

    /**
     * Build error response
     */
    private ErrorResponse buildErrorResponse(String message, int status, String path) {
        return ErrorResponse.builder()
                .message(message)
                .status(status)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .path(path)
                .build();
    }

    /**
     * Simple message response class
     */
    private record MessageResponse(String message) {}
}