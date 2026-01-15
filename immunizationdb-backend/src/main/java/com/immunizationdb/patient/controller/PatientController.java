package com.immunizationdb.patient.controller;

import com.immunizationdb.patient.dto.CreatePatientRequest;
import com.immunizationdb.patient.dto.PatientResponse;
import com.immunizationdb.patient.service.PatientService;
import com.immunizationdb.vaccination.dto.VaccinationResponse;
import com.immunizationdb.vaccination.service.VaccinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PatientController {

    private final PatientService patientService;
    private final VaccinationService vaccinationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<PatientResponse> createPatient(@Valid @RequestBody CreatePatientRequest request) {
        PatientResponse response = patientService.createPatient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<PatientResponse> getPatientById(@PathVariable UUID id) {
        PatientResponse response = patientService.getPatientById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/vaccinations")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccinationResponse>> getPatientVaccinations(@PathVariable UUID id) {
        List<VaccinationResponse> vaccinations = vaccinationService.getVaccinationHistory(id);
        return ResponseEntity.ok(vaccinations);
    }

    @GetMapping("/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<PatientResponse>> getPatientsByFacility(@PathVariable String facilityId) {
        List<PatientResponse> patients = patientService.getPatientsByFacility(facilityId);
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<PatientResponse>> searchPatients(
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "") String searchTerm) {
        // Support both ?q={query} (new format) and ?facilityId={id}&searchTerm={term} (old format)
        String query = q != null && !q.isEmpty() ? q : searchTerm;
        
        List<PatientResponse> patients;
        if (facilityId != null && !facilityId.isEmpty()) {
            // Facility-scoped search
            patients = patientService.searchPatients(facilityId, query);
        } else {
            // Global search (for government officials or when facilityId not provided)
            patients = patientService.searchPatientsGlobal(query);
        }
        
        return ResponseEntity.ok(patients);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Void> deletePatient(@PathVariable UUID id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
