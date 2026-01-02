package com.immunizationdb.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {  // Added 'public' modifier

    private String id;
    private String username;
    private String email;

    @JsonProperty("fullName")
    private String fullName;

    private Role role;  // Added role field

    @JsonProperty("facilityId")
    private String facilityId;  // Added facilityId field

    @JsonProperty("districtId")
    private String districtId;  // Added districtId field

    @JsonProperty("phoneNumber")
    private String phoneNumber;

    @JsonProperty("status")
    private String status;  // ACTIVE, INACTIVE, or LOCKED

    @JsonProperty("active")
    private Boolean active;

    public static UserResponse fromUser(User user) {
        // Determine status based on user state
        String status;
        if (user.getLocked()) {
            status = "LOCKED";
        } else if (!user.getActive()) {
            status = "INACTIVE";
        } else {
            status = "ACTIVE";
        }

        return UserResponse.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .facilityId(user.getFacilityId())
                .districtId(user.getDistrictId())
                .phoneNumber(null)  // Phone number not in User entity yet
                .status(status)
                .active(user.getActive())
                .build();
    }
}