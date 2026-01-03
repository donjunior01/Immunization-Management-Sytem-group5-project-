package com.immunizationdb.appointment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {
    @NotNull(message = "Patient ID is required")
    private UUID patientId;

    @NotBlank(message = "Facility ID is required")
    private String facilityId;

    @NotBlank(message = "Vaccine name is required")
    private String vaccineName;

    @NotNull(message = "Dose number is required")
    private Integer doseNumber;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    private LocalTime appointmentTime;

    private String notes;
}






