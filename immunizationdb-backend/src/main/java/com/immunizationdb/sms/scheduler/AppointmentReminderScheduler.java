package com.immunizationdb.sms.scheduler;

import com.immunizationdb.appointment.entity.Appointment;
import com.immunizationdb.appointment.repository.AppointmentRepository;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.sms.service.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AppointmentReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final SmsService smsService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");
    
    /**
     * Scheduled job runs daily at 6 AM
     * Finds appointments 3 days from now and sends SMS reminders
     */
    @Scheduled(cron = "0 0 6 * * ?") // Every day at 6:00 AM
    @Transactional
    public void sendAppointmentReminders() {
        log.info("Starting appointment reminder job...");
        
        LocalDate targetDate = LocalDate.now().plusDays(3);
        log.info("Looking for appointments on: {}", targetDate);
        
        // Find all appointments 3 days from now that haven't had SMS sent
        List<Appointment> appointments = appointmentRepository.findByAppointmentDateAndSmsSentFalse(targetDate);
        
        if (appointments.isEmpty()) {
            log.info("No appointments found for reminder on {}", targetDate);
            return;
        }
        
        log.info("Found {} appointments to send reminders for", appointments.size());
        
        int successCount = 0;
        int failureCount = 0;
        
        for (Appointment appointment : appointments) {
            try {
                // Get patient information
                Patient patient = patientRepository.findById(appointment.getPatientId())
                        .orElse(null);
                
                if (patient == null) {
                    log.warn("Patient not found for appointment: {}", appointment.getId());
                    failureCount++;
                    continue;
                }
                
                // Check if patient has phone number
                String guardianPhone = patient.getPhoneNumber();
                if (guardianPhone == null || guardianPhone.trim().isEmpty()) {
                    log.warn("No phone number found for patient: {} (appointment: {})", 
                            patient.getId(), appointment.getId());
                    failureCount++;
                    continue;
                }
                
                // Build SMS message
                String message = buildReminderMessage(patient, appointment, targetDate);
                
                // Send SMS
                smsService.sendSMS(
                        guardianPhone,
                        message,
                        appointment.getId(),
                        patient.getId()
                );
                
                // Mark SMS as sent
                appointment.setSmsSent(true);
                appointment.setSmsSentAt(java.time.LocalDateTime.now());
                appointmentRepository.save(appointment);
                
                successCount++;
                log.info("SMS reminder sent successfully for appointment: {} (patient: {})", 
                        appointment.getId(), patient.getId());
                
            } catch (Exception e) {
                log.error("Failed to send SMS reminder for appointment: {}", appointment.getId(), e);
                failureCount++;
            }
        }
        
        log.info("Appointment reminder job completed. Success: {}, Failed: {}", successCount, failureCount);
    }
    
    /**
     * Build SMS reminder message
     */
    private String buildReminderMessage(Patient patient, Appointment appointment, LocalDate appointmentDate) {
        String childName = patient.getFullName();
        String vaccineName = appointment.getVaccineName();
        String formattedDate = appointmentDate.format(DATE_FORMATTER);
        String facilityName = "the facility"; // Could be enhanced to get actual facility name
        
        // Get appointment time if available
        String timeInfo = "";
        if (appointment.getAppointmentTime() != null) {
            timeInfo = " at " + appointment.getAppointmentTime().toString();
        }
        
        return String.format(
                "Reminder: Bring %s for %s vaccination on %s%s at %s. Reply STOP to unsubscribe.",
                childName,
                vaccineName,
                formattedDate,
                timeInfo,
                facilityName
        );
    }
}

