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
        // This method should only be reached if PreAuthorize passes
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "null";
            String authorities = auth != null ? auth.getAuthorities().toString() : "null";
            boolean isAuthenticated = auth != null && auth.isAuthenticated();
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"VaccinationController.java:28\",\"message\":\"recordVaccination called - PreAuthorize passed\",\"data\":{\"hasAuth\":%s,\"isAuthenticated\":%s,\"username\":\"%s\",\"authorities\":\"%s\",\"patientId\":\"%s\",\"facilityId\":\"%s\",\"vaccineName\":\"%s\",\"doseNumber\":%s,\"batchId\":%s,\"dateAdministered\":\"%s\",\"administrationSite\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"VACCINATION_ERROR\"}\n", 
                auth != null,
                isAuthenticated,
                username,
                authorities,
                request.getPatientId() != null ? request.getPatientId().toString() : "null",
                request.getFacilityId() != null ? request.getFacilityId() : "null",
                request.getVaccineName() != null ? request.getVaccineName() : "null",
                request.getDoseNumber() != null ? request.getDoseNumber() : "null",
                request.getBatchId() != null ? request.getBatchId() : "null",
                request.getDateAdministered() != null ? request.getDateAdministered().toString() : "null",
                request.getAdministrationSite() != null ? request.getAdministrationSite() : "null"));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        try {
            VaccinationResponse response = vaccinationService.recordVaccination(request);
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                fw.write(String.format("{\"location\":\"VaccinationController.java:48\",\"message\":\"Vaccination recorded successfully\",\"data\":{\"vaccinationId\":%s,\"patientId\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"VACCINATION_ERROR\"}\n", 
                    response.getId() != null ? response.getId() : "null",
                    response.getPatientId() != null ? response.getPatientId().toString() : "null",
                    System.currentTimeMillis()));
                fw.close();
            } catch (Exception e) {}
            // #endregion
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            // #region agent log
            try {
                java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
                fw.write(String.format("{\"location\":\"VaccinationController.java:56\",\"message\":\"Error in recordVaccination service\",\"data\":{\"message\":\"%s\",\"class\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"VACCINATION_ERROR\"}\n", 
                    e.getMessage().replace("\"", "\\\""), e.getClass().getSimpleName(), System.currentTimeMillis()));
                fw.close();
            } catch (Exception ex) {}
            // #endregion
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
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
