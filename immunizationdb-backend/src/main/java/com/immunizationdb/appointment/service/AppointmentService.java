package com.immunizationdb.appointment.service;

import com.immunizationdb.appointment.dto.AppointmentResponse;
import com.immunizationdb.appointment.dto.CreateAppointmentRequest;
import com.immunizationdb.appointment.entity.Appointment;
import com.immunizationdb.appointment.repository.AppointmentRepository;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.sms.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final SmsService smsService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request) {
        // Verify patient exists
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + request.getPatientId()));

        Appointment appointment = Appointment.builder()
                .patientId(request.getPatientId())
                .facilityId(request.getFacilityId())
                .vaccineName(request.getVaccineName())
                .doseNumber(request.getDoseNumber())
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .status(Appointment.AppointmentStatus.SCHEDULED)
                .notes(request.getNotes())
                .smsSent(false)
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        return mapToResponse(saved, patient);
    }

    public List<AppointmentResponse> getAppointmentsByFacility(String facilityId) {
        List<Appointment> appointments = appointmentRepository.findByFacilityId(facilityId);
        return appointments.stream()
                .map(appointment -> {
                    Patient patient = patientRepository.findById(appointment.getPatientId())
                            .orElse(null);
                    return mapToResponse(appointment, patient);
                })
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getAppointmentsByFacilityAndDate(String facilityId, LocalDate date) {
        List<Appointment> appointments = appointmentRepository.findByFacilityIdAndAppointmentDate(facilityId, date);
        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getAppointmentsByFacilityAndDateRange(
            String facilityId, 
            LocalDate startDate, 
            LocalDate endDate
    ) {
        List<Appointment> appointments = appointmentRepository.findByFacilityIdAndAppointmentDateBetween(
                facilityId, startDate, endDate
        );
        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponse> getAppointmentsByPatient(UUID patientId) {
        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse updateAppointmentStatus(UUID id, Appointment.AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        
        appointment.setStatus(status);
        Appointment updated = appointmentRepository.save(appointment);
        return mapToResponse(updated);
    }

    @Transactional
    public AppointmentResponse updateAppointment(UUID id, CreateAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));

        appointment.setAppointmentDate(request.getAppointmentDate());
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setNotes(request.getNotes());
        appointment.setStatus(Appointment.AppointmentStatus.RESCHEDULED);
        appointment.setSmsSent(false); // Reset SMS flag when rescheduled

        Appointment updated = appointmentRepository.save(appointment);
        
        // Send SMS notification immediately when appointment is rescheduled
        try {
            Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
            if (patient != null && patient.getPhoneNumber() != null && !patient.getPhoneNumber().trim().isEmpty()) {
                String message = buildRescheduleMessage(patient, updated);
                smsService.sendSMS(
                        patient.getPhoneNumber(),
                        message,
                        updated.getId(),
                        patient.getId()
                );
                // Mark SMS as sent
                updated.setSmsSent(true);
                updated.setSmsSentAt(java.time.LocalDateTime.now());
                updated = appointmentRepository.save(updated);
                log.info("Reschedule SMS sent successfully for appointment: {} (patient: {})", 
                        updated.getId(), patient.getId());
            } else {
                log.warn("Cannot send reschedule SMS: patient not found or no phone number for appointment: {}", id);
            }
        } catch (Exception e) {
            log.error("Failed to send reschedule SMS for appointment: {}", id, e);
            // Don't fail the appointment update if SMS fails
        }
        
        return mapToResponse(updated);
    }
    
    /**
     * Build SMS message for rescheduled appointment
     */
    private String buildRescheduleMessage(Patient patient, Appointment appointment) {
        String childName = patient.getFullName();
        String vaccineName = appointment.getVaccineName();
        String formattedDate = appointment.getAppointmentDate().format(DATE_FORMATTER);
        String facilityName = "the facility"; // Could be enhanced to get actual facility name
        
        // Get appointment time if available
        String timeInfo = "";
        if (appointment.getAppointmentTime() != null) {
            timeInfo = " at " + appointment.getAppointmentTime().toString();
        }
        
        return String.format(
                "Appointment Rescheduled: Bring %s for %s vaccination on %s%s at %s. Reply STOP to unsubscribe.",
                childName,
                vaccineName,
                formattedDate,
                timeInfo,
                facilityName
        );
    }

    @Transactional
    public void markSmsSent(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        
        appointment.setSmsSent(true);
        appointment.setSmsSentAt(java.time.LocalDateTime.now());
        appointmentRepository.save(appointment);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        Patient patient = patientRepository.findById(appointment.getPatientId()).orElse(null);
        return mapToResponse(appointment, patient);
    }

    private AppointmentResponse mapToResponse(Appointment appointment, Patient patient) {
        Integer patientAge = null;
        if (patient != null && patient.getDateOfBirth() != null) {
            // Calculate age in months
            java.time.Period period = java.time.Period.between(patient.getDateOfBirth(), java.time.LocalDate.now());
            patientAge = period.getYears() * 12 + period.getMonths();
        }
        
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .patientId(appointment.getPatientId())
                .patientName(patient != null ? patient.getFullName() : "Unknown")
                .patientAge(patientAge)
                .facilityId(appointment.getFacilityId())
                .vaccineName(appointment.getVaccineName())
                .doseNumber(appointment.getDoseNumber())
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus().name())
                .notes(appointment.getNotes())
                .smsSent(appointment.getSmsSent())
                .build();
    }
}


