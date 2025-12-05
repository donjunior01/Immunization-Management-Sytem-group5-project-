package com.immunizationdb.vaccination.service;

import com.immunizationdb.auth.entity.User;
import com.immunizationdb.inventory.service.InventoryService;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.vaccination.dto.RecordVaccinationRequest;
import com.immunizationdb.vaccination.dto.VaccinationResponse;
import com.immunizationdb.vaccination.entity.Vaccination;
import com.immunizationdb.vaccination.repository.VaccinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VaccinationService {

    private final VaccinationRepository vaccinationRepository;
    private final PatientRepository patientRepository;
    private final InventoryService inventoryService;

    @Transactional
    public VaccinationResponse recordVaccination(RecordVaccinationRequest request) {
        log.info("Recording vaccination for patient: {}", request.getPatientId());

        // Validate patient exists
        Patient patient = patientRepository.findByIdAndDeletedFalse(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // Check for duplicate dose
        if (vaccinationRepository.existsByPatientIdAndVaccineNameAndDoseNumber(
                request.getPatientId(), request.getVaccineName(), request.getDoseNumber())) {
            throw new RuntimeException("This dose has already been administered to the patient");
        }

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Create vaccination record
        Vaccination vaccination = Vaccination.builder()
                .patientId(request.getPatientId())
                .batchId(request.getBatchId())
                .nurseId(currentUser.getId())
                .vaccineName(request.getVaccineName())
                .doseNumber(request.getDoseNumber())
                .dateAdministered(request.getDateAdministered())
                .facilityId(request.getFacilityId())
                .notes(request.getNotes())
                .build();

        Vaccination savedVaccination = vaccinationRepository.save(vaccination);

        // Deduct stock (User Story 2.3: Automatic Stock Deduction)
        try {
            inventoryService.deductStock(request.getBatchId(), 1);
            log.info("Stock automatically deducted for batch: {}", request.getBatchId());
        } catch (Exception e) {
            log.error("Failed to deduct stock: {}", e.getMessage());
            throw new RuntimeException("Failed to update inventory: " + e.getMessage());
        }

        log.info("Vaccination recorded successfully with ID: {}", savedVaccination.getId());

        return mapToResponse(savedVaccination, patient.getFullName());
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationHistory(UUID patientId) {
        Patient patient = patientRepository.findByIdAndDeletedFalse(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return vaccinationRepository.findByPatientIdOrderByDateAdministeredDesc(patientId)
                .stream()
                .map(v -> mapToResponse(v, patient.getFullName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationsByFacility(String facilityId) {
        return vaccinationRepository.findByFacilityId(facilityId)
                .stream()
                .map(v -> mapToResponse(v, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationsByDateRange(
            String facilityId, LocalDate startDate, LocalDate endDate) {
        return vaccinationRepository.findByFacilityIdAndDateRange(facilityId, startDate, endDate)
                .stream()
                .map(v -> mapToResponse(v, null))
                .collect(Collectors.toList());
    }

    private VaccinationResponse mapToResponse(Vaccination vaccination, String patientName) {
        return VaccinationResponse.builder()
                .id(vaccination.getId())
                .patientId(vaccination.getPatientId())
                .patientName(patientName)
                .batchId(vaccination.getBatchId())
                .nurseId(vaccination.getNurseId())
                .vaccineName(vaccination.getVaccineName())
                .doseNumber(vaccination.getDoseNumber())
                .dateAdministered(vaccination.getDateAdministered())
                .facilityId(vaccination.getFacilityId())
                .notes(vaccination.getNotes())
                .createdAt(vaccination.getCreatedAt())
                .build();
    }
}
