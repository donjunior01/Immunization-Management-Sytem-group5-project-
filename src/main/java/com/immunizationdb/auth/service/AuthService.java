package com.immunizationdb.auth.service;

import com.immunizationdb.auth.dto.*;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import com.immunizationdb.auth.entity.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.immunizationdb.auth.security.JwtService;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    private static final int MAX_LOGIN_ATTEMPTS = 5;

    /**
     * User Story 1.1: User Authentication System
     * Authenticate user and generate JWT token
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        try {
            // Find user
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

            // Check if account is locked
            if (user.isLocked()) {
                log.warn("Login attempt on locked account: {}", request.getUsername());
                throw new LockedException("Account is locked. Please contact administrator.");
            }

            // Authenticate
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            // Reset failed attempts on successful login
            if (user.getFailedLoginAttempts() > 0) {
                userRepository.updateFailedLoginAttempts(user.getId(), 0);
            }

            // Update last login
            userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

            // Generate JWT token
            String jwtToken = jwtService.generateToken(user);

            // Build response
            UserResponse userResponse = UserResponse.fromUser(user);

            log.info("User {} logged in successfully", request.getUsername());

            return LoginResponse.builder()
                    .token(jwtToken)
                    .user(userResponse)
                    .expiresIn(jwtService.getExpirationTime())
                    .build();

        } catch (BadCredentialsException | LockedException e) {
            handleFailedLogin(request.getUsername());
            throw e;
        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", request.getUsername(), e);
            handleFailedLogin(request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    /**
     * Handle failed login attempts
     * Lock account after max attempts
     */
    @Transactional
    private void handleFailedLogin(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int attempts = user.getFailedLoginAttempts() + 1;
            userRepository.updateFailedLoginAttempts(user.getId(), attempts);

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                userRepository.updateLockedStatus(user.getId(), true);
                log.warn("Account locked due to too many failed attempts: {}", username);
            }
        });
    }

    /**
     * Register new user (for future use)
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .role(Role.valueOf(request.getRole()))
                .enabled(true)
                .locked(false)
                .build();

        user = userRepository.save(user);

        log.info("New user registered: {}", request.getUsername());

        return UserResponse.fromUser(user);
    }

    /**
     * Refresh JWT token
     */
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        try {
            String username = jwtService.extractUsername(request.getToken());
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadCredentialsException("Invalid token"));

            if (jwtService.isTokenValid(request.getToken(), user)) {
                String newToken = jwtService.generateToken(user);

                return LoginResponse.builder()
                        .token(newToken)
                        .user(UserResponse.fromUser(user))
                        .expiresIn(jwtService.getExpirationTime())
                        .build();
            }

            throw new BadCredentialsException("Invalid token");

        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new BadCredentialsException("Invalid or expired token");
        }
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserResponse updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        user = userRepository.save(user);

        log.info("Profile updated for user: {}", user.getUsername());

        return UserResponse.fromUser(user);
    }

    /**
     * Unlock user account (admin function)
     */
    @Transactional
    public void unlockAccount(String userId) {
        userRepository.updateLockedStatus(userId, false);
        userRepository.updateFailedLoginAttempts(userId, 0);
        log.info("Account unlocked: {}", userId);
    }
}