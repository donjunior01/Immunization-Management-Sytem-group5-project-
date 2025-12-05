package com.immunizationdb.campaign.dto;

import com.immunizationdb.campaign.entity.Campaign;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignResponse {
    private Long id;
    private String name;
    private String description;
    private String vaccineName;
    private String targetAgeGroup;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer targetPopulation;
    private Integer vaccinatedCount;
    private Campaign.CampaignStatus status;
    private String facilityId;
    private String districtId;
    private String nationalId;
    private LocalDateTime createdAt;
    private Double coveragePercentage;
}
