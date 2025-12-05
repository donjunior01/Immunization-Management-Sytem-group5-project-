package com.immunizationdb.campaign.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns", indexes = {
    @Index(name = "idx_campaign_dates", columnList = "start_date, end_date"),
    @Index(name = "idx_campaign_status", columnList = "status"),
    @Index(name = "idx_campaign_facility", columnList = "facility_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "vaccine_name", nullable = false, length = 100)
    private String vaccineName;

    @Column(name = "target_age_group", length = 100)
    private String targetAgeGroup;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "target_population")
    private Integer targetPopulation;

    @Column(name = "vaccinated_count")
    private Integer vaccinatedCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CampaignStatus status = CampaignStatus.PLANNED;

    @Column(name = "facility_id", length = 50)
    private String facilityId;

    @Column(name = "district_id", length = 50)
    private String districtId;

    @Column(name = "national_id", length = 50)
    private String nationalId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (vaccinatedCount == null) {
            vaccinatedCount = 0;
        }
        if (status == null) {
            status = CampaignStatus.PLANNED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum CampaignStatus {
        PLANNED, ACTIVE, COMPLETED, CANCELLED
    }

    public double getCoveragePercentage() {
        if (targetPopulation == null || targetPopulation == 0) {
            return 0.0;
        }
        return (vaccinatedCount * 100.0) / targetPopulation;
    }
}
