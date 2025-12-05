package com.immunizationdb.sync.repository;

import com.immunizationdb.sync.entity.OfflineSyncQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfflineSyncQueueRepository extends JpaRepository<OfflineSyncQueue, Long> {

    List<OfflineSyncQueue> findByUserId(Long userId);

    List<OfflineSyncQueue> findBySyncStatus(OfflineSyncQueue.SyncStatus status);

    @Query("SELECT o FROM OfflineSyncQueue o WHERE o.userId = :userId " +
           "AND o.syncStatus = :status ORDER BY o.createdAt ASC")
    List<OfflineSyncQueue> findByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") OfflineSyncQueue.SyncStatus status
    );

    @Query("SELECT o FROM OfflineSyncQueue o WHERE o.syncStatus = 'PENDING' " +
           "AND o.retryCount < :maxRetries ORDER BY o.createdAt ASC")
    List<OfflineSyncQueue> findPendingSyncItems(@Param("maxRetries") int maxRetries);

    @Query("SELECT COUNT(o) FROM OfflineSyncQueue o WHERE o.userId = :userId " +
           "AND o.syncStatus = 'PENDING'")
    Long countPendingByUserId(@Param("userId") Long userId);

    void deleteByUserIdAndSyncStatus(Long userId, OfflineSyncQueue.SyncStatus status);
}
