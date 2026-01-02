package com.immunizationdb.sms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sms_logs", indexes = {
    @Index(name = "idx_sms_log_recipient", columnList = "recipient_phone"),
    @Index(name = "idx_sms_log_status", columnList = "status"),
    @Index(name = "idx_sms_log_appointment", columnList = "appointment_id"),
    @Index(name = "idx_sms_log_patient", columnList = "patient_id"),
    @Index(name = "idx_sms_log_sent_at", columnList = "sent_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SmsStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "appointment_id")
    private UUID appointmentId;

    @Column(name = "patient_id")
    private UUID patientId;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
        if (status == null) {
            status = SmsStatus.PENDING;
        }
    }

    public enum SmsStatus {
        SENT, FAILED, PENDING
    }
}

