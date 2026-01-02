package com.immunizationdb.sms.repository;

import com.immunizationdb.sms.entity.SmsLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SmsLogRepository extends JpaRepository<SmsLog, Long> {
    
    List<SmsLog> findByRecipientPhoneOrderBySentAtDesc(String recipientPhone);
    
    List<SmsLog> findByPatientIdOrderBySentAtDesc(UUID patientId);
    
    List<SmsLog> findByAppointmentIdOrderBySentAtDesc(UUID appointmentId);
    
    List<SmsLog> findByStatusOrderBySentAtDesc(SmsLog.SmsStatus status);
    
    @Query("SELECT s FROM SmsLog s WHERE s.sentAt BETWEEN :startDate AND :endDate ORDER BY s.sentAt DESC")
    List<SmsLog> findBySentAtBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT s FROM SmsLog s WHERE s.sentAt >= :startDate AND s.sentAt <= :endDate " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:recipientPhone IS NULL OR s.recipientPhone = :recipientPhone) " +
           "ORDER BY s.sentAt DESC")
    List<SmsLog> findWithFilters(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("status") SmsLog.SmsStatus status,
            @Param("recipientPhone") String recipientPhone
    );
}

