package com.immunizationdb.auth.dto;

import com.immunizationdb.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// ========== USER RESPONSE ==========
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String username;
    // NEVER include password in response
    private Role role;
    private String facilityId;
    private String districtId;
    private String nationalId;
    private Boolean active;
    private Boolean deleted;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private Long createdBy;
}