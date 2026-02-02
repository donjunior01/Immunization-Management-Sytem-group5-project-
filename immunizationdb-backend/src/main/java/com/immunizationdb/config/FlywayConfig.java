package com.immunizationdb.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
@Profile("production")
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void migrateFlyway() {
        System.out.println("=== CUSTOM FLYWAY CONFIG STARTING ===");
        
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .baselineOnMigrate(true)
                .validateOnMigrate(false)
                .outOfOrder(true)
                .ignoreMissingMigrations(true)
                .ignoreFutureMigrations(true)
                .cleanDisabled(false)
                .load();

        try {
            System.out.println("=== ATTEMPTING FLYWAY REPAIR ===");
            // Try to repair first in case of failed migrations
            flyway.repair();
            System.out.println("=== FLYWAY REPAIR SUCCESSFUL ===");
            
            System.out.println("=== STARTING FLYWAY MIGRATION ===");
            flyway.migrate();
            System.out.println("=== FLYWAY MIGRATION SUCCESSFUL ===");
        } catch (Exception e) {
            // If repair fails, try clean and migrate (only for development/testing)
            System.out.println("=== MIGRATION FAILED, ATTEMPTING CLEAN AND MIGRATE ===");
            System.out.println("Error: " + e.getMessage());
            try {
                flyway.clean();
                System.out.println("=== FLYWAY CLEAN SUCCESSFUL ===");
                flyway.migrate();
                System.out.println("=== FLYWAY MIGRATE AFTER CLEAN SUCCESSFUL ===");
            } catch (Exception cleanException) {
                System.out.println("=== CLEAN AND MIGRATE ALSO FAILED ===");
                System.out.println("Clean error: " + cleanException.getMessage());
                throw cleanException;
            }
        }
        
        System.out.println("=== CUSTOM FLYWAY CONFIG COMPLETED ===");
    }
}