package com.immunizationdb.sms.controller;

import com.immunizationdb.sms.dto.SendSmsRequest;
import com.immunizationdb.sms.dto.SmsLogResponse;
import com.immunizationdb.sms.entity.SmsLog;
import com.immunizationdb.sms.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER')")
    public ResponseEntity<SmsLogResponse> sendSms(@Valid @RequestBody SendSmsRequest request) {
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"SmsLogController.java:sendSms\",\"message\":\"Received send SMS request\",\"data\":{\"phone\":\"%s\",\"messageLength\":%d},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"SMS_SEND\"}\n", 
                request.getPhone() != null ? request.getPhone().replace("\"", "\\\"") : "null",
                request.getMessage() != null ? request.getMessage().length() : 0,
                System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        log.info("Sending SMS to: {}", request.getPhone());
        SmsLog smsLog = smsService.sendSMS(request.getPhone(), request.getMessage());
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"SmsLogController.java:sendSms\",\"message\":\"SMS sent, returning response\",\"data\":{\"smsLogId\":%d,\"status\":\"%s\",\"errorMessage\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"SMS_SEND\"}\n", 
                smsLog.getId() != null ? smsLog.getId() : -1,
                smsLog.getStatus() != null ? smsLog.getStatus().name() : "null",
                smsLog.getErrorMessage() != null ? smsLog.getErrorMessage().replace("\"", "\\\"").substring(0, Math.min(100, smsLog.getErrorMessage().length())) : "null",
                System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(smsLog));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER')")
    public ResponseEntity<Void> deleteSmsLog(@PathVariable Long id) {
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"SmsLogController.java:deleteSmsLog\",\"message\":\"Received delete SMS log request\",\"data\":{\"smsLogId\":%d},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"SMS_DELETE\"}\n", 
                id != null ? id : -1,
                System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        log.info("Deleting SMS log with ID: {}", id);
        smsService.deleteSmsLog(id);
        // #region agent log
        try {
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"SmsLogController.java:deleteSmsLog\",\"message\":\"SMS log deleted successfully\",\"data\":{\"smsLogId\":%d},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"SMS_DELETE\"}\n", 
                id != null ? id : -1,
                System.currentTimeMillis()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        return ResponseEntity.noContent().build();
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

