package com.immunizationdb.adverseevent.dto;

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
public class AdverseEventResponse {

    private Long id;
    private UUID patientId;
    private String patientName;
    private Long vaccinationId;
    private String severity;
    private String description;
    private String actionTaken;
    private Long reportedBy;
    private String reportedByName;
    private LocalDateTime reportedAt;
    private LocalDateTime createdAt;
}

