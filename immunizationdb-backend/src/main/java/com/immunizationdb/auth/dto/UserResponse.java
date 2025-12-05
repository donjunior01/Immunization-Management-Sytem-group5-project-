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

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .facilityId(user.getFacilityId())
                .build();
    }
}