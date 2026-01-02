package com.immunizationdb.sms.controller;

import com.immunizationdb.sms.dto.SmsLogResponse;
import com.immunizationdb.sms.entity.SmsLog;
import com.immunizationdb.sms.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/sms-logs")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class SmsLogController {

    private final SmsService smsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER')")
    public ResponseEntity<List<SmsLogResponse>> getSmsLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String recipient_phone) {
        
        SmsLog.SmsStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                statusEnum = SmsLog.SmsStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status: {}", status);
            }
        }
        
        List<SmsLog> logs = smsService.getSmsLogs(startDate, endDate, statusEnum, recipient_phone);
        List<SmsLogResponse> responses = logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER')")
    public ResponseEntity<SmsLogResponse> getSmsLogById(@PathVariable Long id) {
        SmsLog smsLog = smsService.getSmsLogById(id);
        return ResponseEntity.ok(mapToResponse(smsLog));
    }

    private SmsLogResponse mapToResponse(SmsLog smsLog) {
        return SmsLogResponse.builder()
                .id(smsLog.getId())
                .recipientPhone(smsLog.getRecipientPhone())
                .message(smsLog.getMessage())
                .status(smsLog.getStatus().name())
                .errorMessage(smsLog.getErrorMessage())
                .appointmentId(smsLog.getAppointmentId())
                .patientId(smsLog.getPatientId())
                .sentAt(smsLog.getSentAt())
                .createdAt(smsLog.getCreatedAt())
                .build();
    }
}

