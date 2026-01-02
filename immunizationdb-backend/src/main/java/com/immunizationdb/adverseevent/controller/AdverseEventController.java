package com.immunizationdb.adverseevent.controller;

import com.immunizationdb.adverseevent.dto.AdverseEventResponse;
import com.immunizationdb.adverseevent.dto.CreateAdverseEventRequest;
import com.immunizationdb.adverseevent.service.AdverseEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/adverse-events")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AdverseEventController {

    private final AdverseEventService adverseEventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<AdverseEventResponse> createAdverseEvent(
            @Valid @RequestBody CreateAdverseEventRequest request) {
        try {
            AdverseEventResponse response = adverseEventService.createAdverseEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<AdverseEventResponse>> getPatientAdverseEvents(
            @PathVariable UUID patientId) {
        List<AdverseEventResponse> events = adverseEventService.getPatientAdverseEvents(patientId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/vaccination/{vaccinationId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<AdverseEventResponse>> getVaccinationAdverseEvents(
            @PathVariable Long vaccinationId) {
        List<AdverseEventResponse> events = adverseEventService.getVaccinationAdverseEvents(vaccinationId);
        return ResponseEntity.ok(events);
    }
}

