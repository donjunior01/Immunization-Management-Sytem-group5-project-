package com.immunizationdb.adverseevent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdverseEventRequest {

    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    private Long vaccinationId;

    @NotNull(message = "Severity is required")
    private String severity; // MILD, MODERATE, SEVERE

    @NotBlank(message = "Description is required")
    private String description;

    private String actionTaken;
}

