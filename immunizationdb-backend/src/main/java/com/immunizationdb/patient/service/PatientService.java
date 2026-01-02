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
        // Build full name from firstName/lastName or use provided fullName
        String fullName = request.getFullName();
        if ((fullName == null || fullName.trim().isEmpty()) && 
            (request.getFirstName() != null || request.getLastName() != null)) {
            fullName = String.format("%s %s", 
                request.getFirstName() != null ? request.getFirstName().trim() : "",
                request.getLastName() != null ? request.getLastName().trim() : "").trim();
        }
        
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new IllegalArgumentException("Patient name is required (provide either fullName or firstName+lastName)");
        }

        log.info("Creating new patient: {}", fullName);

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Use address or village (village is alias for address)
        String address = request.getAddress();
        if ((address == null || address.trim().isEmpty()) && request.getVillage() != null) {
            address = request.getVillage();
        }

        Patient patient = Patient.builder()
                .fullName(fullName)
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .guardianName(request.getGuardianName())
                .phoneNumber(request.getPhoneNumber())
                .nationalId(request.getNationalId())
                .address(address)
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
                .nationalId(patient.getNationalId())
                .address(patient.getAddress())
                .facilityId(patient.getFacilityId())
                .createdAt(patient.getCreatedAt())
                .age(calculateAge(patient.getDateOfBirth()))
                .hasSevereAdverseEvents(patient.getHasSevereAdverseEvents())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PatientResponse> searchPatientsGlobal(String searchTerm) {
        // Global search without facility restriction (for government officials)
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return List.of();
        }
        
        String searchPattern = "%" + searchTerm.trim() + "%";
        return patientRepository.findAll().stream()
                .filter(p -> !p.getDeleted())
                .filter(p -> 
                    p.getFullName() != null && p.getFullName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                    p.getGuardianName() != null && p.getGuardianName().toLowerCase().contains(searchTerm.toLowerCase()) ||
                    p.getPhoneNumber() != null && p.getPhoneNumber().contains(searchTerm) ||
                    p.getNationalId() != null && p.getNationalId().contains(searchTerm) ||
                    (p.getId() != null && p.getId().toString().contains(searchTerm))
                )
                .limit(50) // Max 50 results per page
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Integer calculateAge(LocalDate dateOfBirth) {
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}
