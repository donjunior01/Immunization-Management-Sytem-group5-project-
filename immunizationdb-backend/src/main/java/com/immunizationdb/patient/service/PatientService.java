package com.immunizationdb.patient.service;

import com.immunizationdb.auth.entity.User;
import com.immunizationdb.patient.dto.CreatePatientRequest;
import com.immunizationdb.patient.dto.PatientResponse;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;

    @Transactional
    public PatientResponse createPatient(CreatePatientRequest request) {
        log.info("Creating new patient: {}", request.getFullName());

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Patient patient = Patient.builder()
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .guardianName(request.getGuardianName())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .facilityId(request.getFacilityId())
                .createdBy(currentUser.getId())
                .build();

        Patient savedPatient = patientRepository.save(patient);
        log.info("Patient created successfully with ID: {}", savedPatient.getId());

        return mapToResponse(savedPatient);
    }

    @Transactional(readOnly = true)
    public PatientResponse getPatientById(UUID id) {
        Patient patient = patientRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + id));
        return mapToResponse(patient);
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> getPatientsByFacility(String facilityId) {
        return patientRepository.findByFacilityIdAndDeletedFalse(facilityId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> searchPatients(String facilityId, String searchTerm) {
        return patientRepository.searchPatients(facilityId, searchTerm)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePatient(UUID id) {
        Patient patient = patientRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + id));
        patient.setDeleted(true);
        patient.setDeletedAt(java.time.LocalDateTime.now());
        patientRepository.save(patient);
        log.info("Patient soft deleted: {}", id);
    }

    private PatientResponse mapToResponse(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .fullName(patient.getFullName())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .guardianName(patient.getGuardianName())
                .phoneNumber(patient.getPhoneNumber())
                .address(patient.getAddress())
                .facilityId(patient.getFacilityId())
                .createdAt(patient.getCreatedAt())
                .age(calculateAge(patient.getDateOfBirth()))
                .build();
    }

    private Integer calculateAge(LocalDate dateOfBirth) {
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}
