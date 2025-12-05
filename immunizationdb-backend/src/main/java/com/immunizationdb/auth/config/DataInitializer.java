package com.immunizationdb.auth.config;

import com.immunizationdb.auth.entity.Role;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Users are initialized via Flyway migration script
        // Default users:
        //   Username: health.worker | Password: Password123! | Role: HEALTH_WORKER
        //   Username: facility.manager | Password: Password123! | Role: FACILITY_MANAGER
        //   Username: gov.official | Password: Password123! | Role: GOVERNMENT_OFFICIAL
        
        long userCount = userRepository.count();
        log.info("=".repeat(80));
        log.info("Database initialized successfully with {} users", userCount);
        log.info("=".repeat(80));
        log.info("DEFAULT LOGIN CREDENTIALS:");
        log.info("  Health Worker:      health.worker / Password123!");
        log.info("  Facility Manager:   facility.manager / Password123!");
        log.info("  Government Official: gov.official / Password123!");
        log.info("=".repeat(80));
    }

    private void createUserIfNotExists(String username, String password, String email,
                                       String fullName, Role role) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .password(passwordEncoder.encode(password))
                    .email(email)
                    .fullName(fullName)
                    .role(role)
                    .active(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .build();

            userRepository.save(user);
            log.info("Created test user: {}", username);
        }
    }
}