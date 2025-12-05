package com.immunizationdb.auth.entity;

public enum Role {
    HEALTH_WORKER("Health Worker", "Records vaccinations and manages patient data"),
    FACILITY_MANAGER("Facility Manager", "Manages facility operations, campaigns, and reports"),
    GOVERNMENT_OFFICIAL("Government Official", "System administration and national-level oversight");

    private final String displayName;
    private final String description;

    Role(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }
}