package com.immunizationdb.adverseevent.service;

import com.immunizationdb.adverseevent.dto.AdverseEventResponse;
import com.immunizationdb.adverseevent.dto.CreateAdverseEventRequest;
import com.immunizationdb.adverseevent.entity.AdverseEvent;
import com.immunizationdb.adverseevent.repository.AdverseEventRepository;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdverseEventService {

    private final AdverseEventRepository adverseEventRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Transactional
    public AdverseEventResponse createAdverseEvent(CreateAdverseEventRequest request) {
        log.info("Creating adverse event for patient: {}", request.getPatientId());

        // Validate patient exists
        Patient patient = patientRepository.findByIdAndDeletedFalse(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // Get current user
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Parse severity
        AdverseEvent.Severity severity;
        try {
            severity = AdverseEvent.Severity.valueOf(request.getSeverity().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid severity. Must be MILD, MODERATE, or SEVERE");
        }

        // Create adverse event
        AdverseEvent adverseEvent = AdverseEvent.builder()
                .patientId(request.getPatientId())
                .vaccinationId(request.getVaccinationId())
                .severity(severity)
                .description(request.getDescription())
                .actionTaken(request.getActionTaken())
                .reportedBy(currentUser.getId())
                .build();

        AdverseEvent savedEvent = adverseEventRepository.save(adverseEvent);

        // If severity is SEVERE, flag the patient record
        if (severity == AdverseEvent.Severity.SEVERE) {
            patient.setHasSevereAdverseEvents(true);
            patientRepository.save(patient);
            log.info("Patient {} flagged for severe adverse events", request.getPatientId());
        }

        log.info("Adverse event created successfully with ID: {}", savedEvent.getId());

        return mapToResponse(savedEvent, patient.getFullName());
    }

    @Transactional(readOnly = true)
    public List<AdverseEventResponse> getPatientAdverseEvents(UUID patientId) {
        Patient patient = patientRepository.findByIdAndDeletedFalse(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return adverseEventRepository.findByPatientIdOrderByReportedAtDesc(patientId)
                .stream()
                .map(event -> mapToResponse(event, patient.getFullName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdverseEventResponse> getVaccinationAdverseEvents(Long vaccinationId) {
        return adverseEventRepository.findByVaccinationIdOrderByReportedAtDesc(vaccinationId)
                .stream()
                .map(event -> {
                    String patientName = null;
                    try {
                        Patient patient = patientRepository.findByIdAndDeletedFalse(event.getPatientId()).orElse(null);
                        patientName = patient != null ? patient.getFullName() : null;
                    } catch (Exception e) {
                        log.warn("Could not fetch patient name for patient ID: {}", event.getPatientId(), e);
                    }
                    return mapToResponse(event, patientName);
                })
                .collect(Collectors.toList());
    }

    private AdverseEventResponse mapToResponse(AdverseEvent event, String patientName) {
        // Fetch reporter name
        String reporterName = null;
        if (event.getReportedBy() != null) {
            try {
                User reporter = userRepository.findById(event.getReportedBy()).orElse(null);
                reporterName = reporter != null ? reporter.getFullName() : null;
            } catch (Exception e) {
                log.warn("Could not fetch reporter name for user ID: {}", event.getReportedBy(), e);
            }
        }

        return AdverseEventResponse.builder()
                .id(event.getId())
                .patientId(event.getPatientId())
                .patientName(patientName)
                .vaccinationId(event.getVaccinationId())
                .severity(event.getSeverity().name())
                .description(event.getDescription())
                .actionTaken(event.getActionTaken())
                .reportedBy(event.getReportedBy())
                .reportedByName(reporterName)
                .reportedAt(event.getReportedAt())
                .createdAt(event.getCreatedAt())
                .build();
    }
}

