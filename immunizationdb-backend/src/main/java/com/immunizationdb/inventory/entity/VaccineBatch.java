package com.immunizationdb.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccine_batches", 
    uniqueConstraints = @UniqueConstraint(name = "uk_batch_facility", columnNames = {"batch_number", "facility_id"}),
    indexes = {
        @Index(name = "idx_facility_batches", columnList = "facility_id"),
        @Index(name = "idx_vaccine_name", columnList = "vaccine_name"),
        @Index(name = "idx_expiry_date", columnList = "expiry_date")
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Column(name = "vaccine_name", nullable = false, length = 100)
    private String vaccineName;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(name = "quantity_received", nullable = false)
    private Integer quantityReceived;

    @Column(name = "quantity_remaining", nullable = false)
    private Integer quantityRemaining;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDate.now());
    }

    public boolean isExpiringSoon(int daysThreshold) {
        return expiryDate.isBefore(LocalDate.now().plusDays(daysThreshold));
    }
}
