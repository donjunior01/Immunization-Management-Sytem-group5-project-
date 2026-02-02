package com.immunizationdb.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

@Configuration
@Profile("production")
public class ProductionDataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        // Hardcoded database configuration for Render
        config.setJdbcUrl("jdbc:postgresql://dpg-d5vtfdvpm1nc73ct44gg-a:5432/immunizationdb");
        config.setUsername("immunizationdb_user");
        config.setPassword("8WJDR7Ss865Njh7kLVUhTc4GpngqujLQ");
        config.setDriverClassName("org.postgresql.Driver");
        
        // Connection pool settings
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(10);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        // Additional settings
        config.setLeakDetectionThreshold(60000);
        config.setConnectionTestQuery("SELECT 1");
        
        return new HikariDataSource(config);
    }
}