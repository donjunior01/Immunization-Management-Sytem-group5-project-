package com.immunizationdb.vaccination.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecordVaccinationRequest {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    // Batch ID is optional - if not provided, system will auto-select oldest non-expired batch (FIFO)
    private Long batchId;

    @NotBlank(message = "Vaccine name is required")
    private String vaccineName;

    @NotNull(message = "Dose number is required")
    @Positive(message = "Dose number must be positive")
    private Integer doseNumber;

    @NotNull(message = "Date administered is required")
    private LocalDate dateAdministered;

    @NotBlank(message = "Facility ID is required")
    private String facilityId;

    @NotBlank(message = "Administration site is required")
    private String administrationSite;

    private String notes;
}
