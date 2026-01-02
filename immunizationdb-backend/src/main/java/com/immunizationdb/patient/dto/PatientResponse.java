package com.immunizationdb.patient.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientResponse {
    private UUID id;
    private String fullName;
    private LocalDate dateOfBirth;
    private String gender;
    private String guardianName;
    private String phoneNumber;
    private String nationalId;
    private String address;
    private String facilityId;
    private LocalDateTime createdAt;
    private Integer age;
    private Boolean hasSevereAdverseEvents;
}
