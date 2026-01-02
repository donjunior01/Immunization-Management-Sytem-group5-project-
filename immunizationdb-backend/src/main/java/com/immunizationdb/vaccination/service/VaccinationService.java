package com.immunizationdb.vaccination.service;

import com.immunizationdb.appointment.dto.CreateAppointmentRequest;
import com.immunizationdb.appointment.service.AppointmentService;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import com.immunizationdb.inventory.entity.VaccineBatch;
import com.immunizationdb.inventory.repository.VaccineBatchRepository;
import com.immunizationdb.inventory.service.InventoryService;
import com.immunizationdb.patient.entity.Patient;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.vaccination.dto.RecordVaccinationRequest;
import com.immunizationdb.vaccination.dto.VaccinationResponse;
import com.immunizationdb.vaccination.entity.Vaccination;
import com.immunizationdb.vaccination.repository.VaccinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VaccinationService {

    private final VaccinationRepository vaccinationRepository;
    private final PatientRepository patientRepository;
    private final InventoryService inventoryService;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final UserRepository userRepository;
    private final AppointmentService appointmentService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public VaccinationResponse recordVaccination(RecordVaccinationRequest request) {
        log.info("Recording vaccination for patient: {}", request.getPatientId());

        // Validate patient exists
        Patient patient = patientRepository.findByIdAndDeletedFalse(request.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        // Check for duplicate dose
        if (vaccinationRepository.existsByPatientIdAndVaccineNameAndDoseNumber(
                request.getPatientId(), request.getVaccineName(), request.getDoseNumber())) {
            throw new RuntimeException("This dose has already been administered to the patient");
        }

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Validate dose number based on vaccine type
        int maxDoses = getMaxDosesForVaccine(request.getVaccineName());
        if (request.getDoseNumber() > maxDoses) {
            throw new RuntimeException(String.format("Invalid dose number. %s has a maximum of %d doses.", 
                request.getVaccineName(), maxDoses));
        }

        // Auto-deduct stock using FIFO (oldest non-expired batch first) BEFORE creating vaccination
        // This ensures atomicity - if stock deduction fails, vaccination is not created
        Long batchIdToUse = request.getBatchId();
        try {
            // If batchId is provided, use it; otherwise find oldest batch automatically (FIFO)
            if (batchIdToUse == null) {
                log.info("No batch ID provided, finding oldest non-expired batch (FIFO) for vaccine: {}", request.getVaccineName());
                batchIdToUse = inventoryService.deductStockForVaccine(
                        request.getFacilityId(), 
                        request.getVaccineName(), 
                        1);
                log.info("Automatically selected batch ID: {} for vaccine: {}", batchIdToUse, request.getVaccineName());
            } else {
                // Use provided batch ID but still create stock movement
                inventoryService.deductStock(batchIdToUse, 1);
                log.info("Stock deducted for provided batch: {}", batchIdToUse);
            }
        } catch (Exception e) {
            log.error("Failed to deduct stock: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update inventory: " + e.getMessage());
        }

        // Create vaccination record with the batch ID used
        Vaccination vaccination = Vaccination.builder()
                .patientId(request.getPatientId())
                .batchId(batchIdToUse)
                .nurseId(currentUser.getId())
                .vaccineName(request.getVaccineName())
                .doseNumber(request.getDoseNumber())
                .dateAdministered(request.getDateAdministered())
                .facilityId(request.getFacilityId())
                .administrationSite(request.getAdministrationSite())
                .notes(request.getNotes())
                .build();

        Vaccination savedVaccination = vaccinationRepository.save(vaccination);

        // Auto-create next appointment if next dose exists
        UUID nextAppointmentId = null;
        LocalDate nextAppointmentDate = null;
        try {
            int nextDoseNumber = request.getDoseNumber() + 1;
            // maxDoses is already declared on line 58, reuse it here
            
            if (nextDoseNumber <= maxDoses) {
                // Get dose interval from vaccines table
                Integer intervalDays = getDoseIntervalDays(request.getVaccineName());
                
                if (intervalDays != null && intervalDays > 0) {
                    // Calculate next appointment date
                    nextAppointmentDate = request.getDateAdministered().plusDays(intervalDays);
                    
                    // Create appointment automatically
                    CreateAppointmentRequest appointmentRequest = CreateAppointmentRequest.builder()
                            .patientId(request.getPatientId())
                            .facilityId(request.getFacilityId())
                            .vaccineName(request.getVaccineName())
                            .doseNumber(nextDoseNumber)
                            .appointmentDate(nextAppointmentDate)
                            .notes(String.format("Auto-scheduled for %s dose %d", request.getVaccineName(), nextDoseNumber))
                            .build();
                    
                    var appointmentResponse = appointmentService.createAppointment(appointmentRequest);
                    nextAppointmentId = appointmentResponse.getId();
                    log.info("Auto-created appointment for next dose: {} dose {} on {}", 
                            request.getVaccineName(), nextDoseNumber, nextAppointmentDate);
                } else {
                    log.info("No interval days configured for vaccine: {}, skipping appointment creation", 
                            request.getVaccineName());
                }
            } else {
                log.info("No next dose for vaccine: {} (current dose: {}, max: {})", 
                        request.getVaccineName(), request.getDoseNumber(), maxDoses);
            }
        } catch (Exception e) {
            // Log error but don't fail vaccination recording if appointment creation fails
            log.error("Failed to auto-create appointment: {}", e.getMessage(), e);
        }

        log.info("Vaccination recorded successfully with ID: {}", savedVaccination.getId());

        VaccinationResponse response = mapToResponse(savedVaccination, patient.getFullName());
        response.setNextAppointmentId(nextAppointmentId);
        response.setNextAppointmentDate(nextAppointmentDate);
        return response;
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationHistory(UUID patientId) {
        Patient patient = patientRepository.findByIdAndDeletedFalse(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        return vaccinationRepository.findByPatientIdOrderByDateAdministeredDesc(patientId)
                .stream()
                .map(v -> mapToResponse(v, patient.getFullName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationsByFacility(String facilityId) {
        List<Vaccination> vaccinations = vaccinationRepository.findByFacilityId(facilityId);
        log.info("Found {} vaccinations for facility: {}", vaccinations.size(), facilityId);
        
        return vaccinations.stream()
                .map(v -> {
                    // Fetch patient name for each vaccination
                    String patientName = null;
                    try {
                        Patient patient = patientRepository.findByIdAndDeletedFalse(v.getPatientId()).orElse(null);
                        patientName = patient != null ? patient.getFullName() : null;
                    } catch (Exception e) {
                        log.warn("Could not fetch patient name for patient ID: {}", v.getPatientId(), e);
                    }
                    return mapToResponse(v, patientName);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccinationResponse> getVaccinationsByDateRange(
            String facilityId, LocalDate startDate, LocalDate endDate) {
        List<Vaccination> vaccinations = vaccinationRepository.findByFacilityIdAndDateRange(facilityId, startDate, endDate);
        
        return vaccinations.stream()
                .map(v -> {
                    // Fetch patient name for each vaccination
                    String patientName = null;
                    try {
                        Patient patient = patientRepository.findByIdAndDeletedFalse(v.getPatientId()).orElse(null);
                        patientName = patient != null ? patient.getFullName() : null;
                    } catch (Exception e) {
                        log.warn("Could not fetch patient name for patient ID: {}", v.getPatientId(), e);
                    }
                    return mapToResponse(v, patientName);
                })
                .collect(Collectors.toList());
    }

    private VaccinationResponse mapToResponse(Vaccination vaccination, String patientName) {
        // Fetch batch number
        String batchNumber = null;
        if (vaccination.getBatchId() != null) {
            try {
                VaccineBatch batch = vaccineBatchRepository.findById(vaccination.getBatchId()).orElse(null);
                batchNumber = batch != null ? batch.getBatchNumber() : null;
            } catch (Exception e) {
                log.warn("Could not fetch batch number for batch ID: {}", vaccination.getBatchId(), e);
            }
        }
        
        // Fetch nurse name
        String nurseName = null;
        if (vaccination.getNurseId() != null) {
            try {
                User nurse = userRepository.findById(vaccination.getNurseId()).orElse(null);
                nurseName = nurse != null ? nurse.getFullName() : null;
            } catch (Exception e) {
                log.warn("Could not fetch nurse name for nurse ID: {}", vaccination.getNurseId(), e);
            }
        }
        
        return VaccinationResponse.builder()
                .id(vaccination.getId())
                .patientId(vaccination.getPatientId())
                .patientName(patientName)
                .batchId(vaccination.getBatchId())
                .batchNumber(batchNumber)
                .nurseId(vaccination.getNurseId())
                .nurseName(nurseName)
                .vaccineName(vaccination.getVaccineName())
                .doseNumber(vaccination.getDoseNumber())
                .dateAdministered(vaccination.getDateAdministered())
                .facilityId(vaccination.getFacilityId())
                .administrationSite(vaccination.getAdministrationSite())
                .notes(vaccination.getNotes())
                .createdAt(vaccination.getCreatedAt())
                .build();
    }

    private int getMaxDosesForVaccine(String vaccineName) {
        return switch (vaccineName.toUpperCase()) {
            case "BCG" -> 1;
            case "OPV" -> 4;
            case "DTP", "PENTA" -> 3;
            case "MEASLES" -> 2;
            case "HEPATITIS B" -> 3;
            case "ROTAVIRUS" -> 2;
            case "PNEUMOCOCCAL" -> 3;
            case "COVID-19" -> 3;
            case "TETANUS" -> 5;
            case "YELLOW FEVER" -> 1;
            case "MENINGITIS" -> 1;
            default -> 1;
        };
    }

    /**
     * Get dose interval days from vaccines table
     * @param vaccineName Name of the vaccine
     * @return Interval in days between doses, or null if not found
     */
    private Integer getDoseIntervalDays(String vaccineName) {
        try {
            String sql = "SELECT dose_interval_days FROM vaccines WHERE UPPER(name) = UPPER(?) AND active = true";
            Integer interval = jdbcTemplate.queryForObject(sql, Integer.class, vaccineName);
            return interval != null ? interval : getDefaultIntervalDays(vaccineName);
        } catch (Exception e) {
            log.warn("Could not fetch dose interval from database for vaccine: {}, using default", vaccineName, e);
            return getDefaultIntervalDays(vaccineName);
        }
    }

    /**
     * Get default interval days if not found in database
     */
    private Integer getDefaultIntervalDays(String vaccineName) {
        return switch (vaccineName.toUpperCase()) {
            case "BCG", "YELLOW FEVER" -> 0; // Single dose vaccines
            case "OPV", "DTP", "PENTA", "HEPATITIS B", "ROTAVIRUS", "PNEUMOCOCCAL" -> 28; // 4 weeks
            case "MEASLES" -> 180; // 6 months
            default -> 28; // Default 4 weeks
        };
    }
}
