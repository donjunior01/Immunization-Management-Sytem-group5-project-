package com.immunizationdb.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotBlank(message = "Campaign name is required")
    private String name;

    private String description;

    @NotBlank(message = "Vaccine name is required")
    private String vaccineName;

    private String targetAgeGroup;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Integer targetPopulation;

    private String facilityId;
    private String districtId;
    private String nationalId;
}
