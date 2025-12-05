package com.immunizationdb.vaccination.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccinationResponse {
    private Long id;
    private UUID patientId;
    private String patientName;
    private Long batchId;
    private String batchNumber;
    private Long nurseId;
    private String nurseName;
    private String vaccineName;
    private Integer doseNumber;
    private LocalDate dateAdministered;
    private String facilityId;
    private String notes;
    private LocalDateTime createdAt;
}
