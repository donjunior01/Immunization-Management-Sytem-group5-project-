package com.immunizationdb.appointment.controller;

import com.immunizationdb.appointment.dto.AppointmentResponse;
import com.immunizationdb.appointment.dto.CreateAppointmentRequest;
import com.immunizationdb.appointment.entity.Appointment;
import com.immunizationdb.appointment.service.AppointmentService;
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
@RequestMapping("/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<AppointmentResponse> createAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.createAppointment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) UUID patientId) {
        
        List<AppointmentResponse> appointments;
        
        if (patientId != null) {
            appointments = appointmentService.getAppointmentsByPatient(patientId);
        } else if (facilityId != null && date != null) {
            appointments = appointmentService.getAppointmentsByFacilityAndDate(facilityId, date);
        } else if (facilityId != null && startDate != null && endDate != null) {
            appointments = appointmentService.getAppointmentsByFacilityAndDateRange(facilityId, startDate, endDate);
        } else if (facilityId != null) {
            // Get all appointments for facility
            appointments = appointmentService.getAppointmentsByFacility(facilityId);
        } else {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<AppointmentResponse> getAppointmentById(@PathVariable UUID id) {
        // This would need a getById method in service
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody CreateAppointmentRequest request) {
        AppointmentResponse response = appointmentService.updateAppointment(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<AppointmentResponse> updateAppointmentStatus(
            @PathVariable UUID id,
            @RequestParam Appointment.AppointmentStatus status) {
        AppointmentResponse response = appointmentService.updateAppointmentStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        // Would need delete method in service
        return ResponseEntity.noContent().build();
    }
}
