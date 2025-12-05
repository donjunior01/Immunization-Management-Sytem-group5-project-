package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NationalStatisticsResponse {
    private Integer totalFacilities;
    private Integer totalVaccineTypes;
    private Integer totalDosesAvailable;
    private Integer totalPatientsRegistered;
    private Integer totalVaccinationsAdministered;
    private Integer activeCampaigns;
    private Integer lowStockAlerts;
    private Integer expiringBatches;
    private Double coverageRate;
    private Integer facilitiesWithAlerts;
    private List<RecentActivity> recentActivities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private Long id;
        private String type; // "vaccination", "campaign", "stock_alert", "batch_expiry"
        private String description;
        private LocalDateTime timestamp;
        private String facilityId;
        private String facilityName;
    }
}
