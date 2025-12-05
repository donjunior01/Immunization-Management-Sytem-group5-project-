package com.immunizationdb.sync.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "offline_sync_queue", indexes = {
    @Index(name = "idx_sync_status", columnList = "sync_status"),
    @Index(name = "idx_sync_user", columnList = "user_id"),
    @Index(name = "idx_sync_created", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineSyncQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    @Column(name = "operation_type", nullable = false, length = 20)
    private String operationType; // INSERT, UPDATE, DELETE

    @Column(name = "entity_data", columnDefinition = "TEXT")
    private String entityData; // JSON representation

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status", nullable = false, length = 20)
    private SyncStatus syncStatus = SyncStatus.PENDING;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (syncStatus == null) {
            syncStatus = SyncStatus.PENDING;
        }
        if (retryCount == null) {
            retryCount = 0;
        }
    }

    public enum SyncStatus {
        PENDING, SYNCED, FAILED, CONFLICT
    }
}
