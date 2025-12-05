package com.immunizationdb.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVaccineBatchRequest {

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotBlank(message = "Vaccine name is required")
    private String vaccineName;

    @NotBlank(message = "Manufacturer is required")
    private String manufacturer;

    @NotNull(message = "Quantity received is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantityReceived;

    @NotNull(message = "Expiry date is required")
    private LocalDate expiryDate;

    @NotNull(message = "Receipt date is required")
    private LocalDate receiptDate;

    @NotBlank(message = "Facility ID is required")
    private String facilityId;
}
