package com.immunizationdb.inventory.dto;

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
public class VaccineBatchResponse {
    private Long id;
    private String batchNumber;
    private String vaccineName;
    private String manufacturer;
    private Integer quantityReceived;
    private Integer quantityRemaining;
    private LocalDate expiryDate;
    private LocalDate receiptDate;
    private String facilityId;
    private LocalDateTime createdAt;
    private Boolean isExpired;
    private Boolean isExpiringSoon;
    private Integer daysUntilExpiry;
}
