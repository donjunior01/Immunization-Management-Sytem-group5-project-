package com.immunizationdb.vaccination.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vaccinations", indexes = {
    @Index(name = "idx_patient_vaccinations", columnList = "patient_id"),
    @Index(name = "idx_batch_vaccinations", columnList = "batch_id"),
    @Index(name = "idx_facility_vaccinations", columnList = "facility_id"),
    @Index(name = "idx_vaccination_date", columnList = "date_administered")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vaccination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "nurse_id", nullable = false)
    private Long nurseId;

    @Column(name = "vaccine_name", nullable = false, length = 100)
    private String vaccineName;

    @Column(name = "dose_number", nullable = false)
    private Integer doseNumber;

    @Column(name = "date_administered", nullable = false)
    private LocalDate dateAdministered;

    @Column(name = "facility_id", nullable = false, length = 50)
    private String facilityId;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
