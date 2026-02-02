package com.immunizationdb.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("production")
public class FlywayConfig {
    // Flyway is now handled automatically by Spring Boot
    // This class remains for future custom migration logic if needed
}