package com.immunizationdb.inventory.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_stock_movement_facility", columnList = "facility_id"),
    @Index(name = "idx_stock_movement_vaccine", columnList = "vaccine_id"),
    @Index(name = "idx_stock_movement_batch", columnList = "batch_number"),
    @Index(name = "idx_stock_movement_type", columnList = "movement_type"),
    @Index(name = "idx_stock_movement_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(name = "vaccine_id", nullable = false, length = 100)
    private String vaccineId;

    @Column(name = "batch_number", nullable = false, length = 50)
    private String batchNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 20)
    private MovementType movementType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum MovementType {
        RECEIVED, USED, ADJUSTED, DAMAGED, EXPIRED
    }
}

