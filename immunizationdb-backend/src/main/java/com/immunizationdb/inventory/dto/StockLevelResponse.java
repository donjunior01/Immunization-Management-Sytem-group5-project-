package com.immunizationdb.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLevelResponse {
    private String vaccineId;
    private String vaccineName;
    private Integer currentQuantity;
    private LocalDate oldestExpiryDate;
    private String status; // "GOOD", "LOW", "CRITICAL"
}

