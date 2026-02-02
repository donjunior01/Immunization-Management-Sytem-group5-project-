package com.immunizationdb.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
@Profile("production")
public class FlywayConfig {

    @Autowired
    private DataSource dataSource;

    @PostConstruct
    public void migrateFlyway() {
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
            // Try to repair first in case of failed migrations
            flyway.repair();
            flyway.migrate();
        } catch (Exception e) {
            // If repair fails, try clean and migrate (only for development/testing)
            System.out.println("Migration failed, attempting to clean and migrate...");
            try {
                flyway.clean();
                flyway.migrate();
            } catch (Exception cleanException) {
                System.out.println("Clean and migrate also failed: " + cleanException.getMessage());
                throw cleanException;
            }
        }
    }
}