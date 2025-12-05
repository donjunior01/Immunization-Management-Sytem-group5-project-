package com.immunizationdb.vaccination.controller;

import com.immunizationdb.vaccination.dto.RecordVaccinationRequest;
import com.immunizationdb.vaccination.dto.VaccinationResponse;
import com.immunizationdb.vaccination.service.VaccinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/vaccinations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class VaccinationController {

    private final VaccinationService vaccinationService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccinationResponse> recordVaccination(@Valid @RequestBody RecordVaccinationRequest request) {
        VaccinationResponse response = vaccinationService.recordVaccination(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccinationResponse>> getVaccinationHistory(@PathVariable UUID patientId) {
        List<VaccinationResponse> history = vaccinationService.getVaccinationHistory(patientId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccinationResponse>> getVaccinationsByFacility(@PathVariable String facilityId) {
        List<VaccinationResponse> vaccinations = vaccinationService.getVaccinationsByFacility(facilityId);
        return ResponseEntity.ok(vaccinations);
    }

    @GetMapping("/facility/{facilityId}/date-range")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccinationResponse>> getVaccinationsByDateRange(
            @PathVariable String facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<VaccinationResponse> vaccinations = 
                vaccinationService.getVaccinationsByDateRange(facilityId, startDate, endDate);
        return ResponseEntity.ok(vaccinations);
    }
}
