package com.immunizationdb.sms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmsLogResponse {
    
    private Long id;
    private String recipientPhone;
    private String message;
    private String status;
    private String errorMessage;
    private UUID appointmentId;
    private UUID patientId;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}

