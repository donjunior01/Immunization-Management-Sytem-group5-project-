package com.immunizationdb.patient.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "patients", indexes = {
    @Index(name = "idx_facility_patients", columnList = "facility_id"),
    @Index(name = "idx_patient_dob", columnList = "date_of_birth"),
    @Index(name = "idx_patient_deleted", columnList = "deleted")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(name = "guardian_name")
    private String guardianName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "national_id", length = 50, unique = true)
    private String nationalId;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "has_severe_adverse_events", nullable = false)
    @Builder.Default
    private Boolean hasSevereAdverseEvents = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (deleted == null) {
            deleted = false;
        }
        if (hasSevereAdverseEvents == null) {
            hasSevereAdverseEvents = false;
        }
    }
}
