package com.immunizationdb.auth.dto;

import com.immunizationdb.auth.entity.Role;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// ========== CREATE USER REQUEST ==========
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequestDTO {
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Username can only contain letters, numbers, dots, underscores, and hyphens")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @Size(max = 50, message = "Facility ID cannot exceed 50 characters")
    private String facilityId;

    @Size(max = 50, message = "District ID cannot exceed 50 characters")
    private String districtId;

    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;
}