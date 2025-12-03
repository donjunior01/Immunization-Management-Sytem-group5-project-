package com.immunizationdb.auth.dto;

import com.immunizationdb.auth.entity.Role;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// ========== UPDATE USER REQUEST ==========
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDTO {
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    private String password; // Optional - only if changing password

    @NotNull(message = "Role is required")
    private Role role;

    @Size(max = 50, message = "Facility ID cannot exceed 50 characters")
    private String facilityId;

    @Size(max = 50, message = "District ID cannot exceed 50 characters")
    private String districtId;

    @Size(max = 50, message = "National ID cannot exceed 50 characters")
    private String nationalId;

    private Boolean active;
}