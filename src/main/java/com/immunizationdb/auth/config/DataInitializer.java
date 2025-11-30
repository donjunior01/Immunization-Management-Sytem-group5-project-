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
        // Create test users if they don't exist
        createUserIfNotExists("health_worker", "password123", "health@immunizedb.com",
                "Health Worker", Role.HEALTH_WORKER);

        createUserIfNotExists("facility_manager", "password123", "manager@immunizedb.com",
                "Facility Manager", Role.FACILITY_MANAGER);

        createUserIfNotExists("admin", "password123", "admin@immunizedb.com",
                "Government Official", Role.GOVERNMENT_OFFICIAL);

        log.info("Test users initialized successfully");
        log.info("Login credentials:");
        log.info("  Health Worker: health_worker / password123");
        log.info("  Facility Manager: facility_manager / password123");
        log.info("  Government Official: admin / password123");
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
                    .enabled(true)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .build();

            userRepository.save(user);
            log.info("Created test user: {}", username);
        }
    }
}