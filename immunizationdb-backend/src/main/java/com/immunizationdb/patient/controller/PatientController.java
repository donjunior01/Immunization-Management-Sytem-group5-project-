package com.immunizationdb.patient.controller;

import com.immunizationdb.patient.dto.CreatePatientRequest;
import com.immunizationdb.patient.dto.PatientResponse;
import com.immunizationdb.patient.service.PatientService;
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

    @GetMapping("/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<PatientResponse>> getPatientsByFacility(@PathVariable String facilityId) {
        List<PatientResponse> patients = patientService.getPatientsByFacility(facilityId);
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<PatientResponse>> searchPatients(
            @RequestParam String facilityId,
            @RequestParam String searchTerm) {
        List<PatientResponse> patients = patientService.searchPatients(facilityId, searchTerm);
        return ResponseEntity.ok(patients);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Void> deletePatient(@PathVariable UUID id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
