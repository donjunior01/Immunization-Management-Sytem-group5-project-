package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalPatients;
    private Long totalVaccinations;
    private Long vaccinationsThisMonth;
    private Long activeCampaigns;
    private Integer availableBatches;
    private Integer expiringBatches;
    private Double coverageRate;
    private Long pendingSyncItems;
}
