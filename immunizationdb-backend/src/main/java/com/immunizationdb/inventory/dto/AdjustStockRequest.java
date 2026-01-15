package com.immunizationdb.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustStockRequest {

    @NotBlank(message = "Vaccine ID is required")
    private String vaccineId;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    @NotNull(message = "Quantity change is required")
    private Integer quantityChange;

    @NotBlank(message = "Reason is required")
    private String reason; // DAMAGED, EXPIRED, LOST, CORRECTION

    private String notes;
}





