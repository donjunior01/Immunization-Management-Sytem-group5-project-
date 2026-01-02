package com.immunizationdb.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePatientRequest {

    // Support both fullName (for backward compatibility) and firstName/lastName
    private String fullName;
    private String firstName;
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Gender must be MALE, FEMALE, or OTHER")
    private String gender;

    @NotBlank(message = "Guardian name is required")
    private String guardianName;

    @Pattern(regexp = "^\\+237[26]\\d{8}$", message = "Phone number must be in Cameroon format: +237XXXXXXXXX")
    private String phoneNumber;

    private String nationalId;
    private String address;
    private String village; // Alias for address

    @NotBlank(message = "Facility ID is required")
    private String facilityId;
}
