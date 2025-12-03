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

    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())  // Changed from .Role() to .role()
                .fullName(user.getFullName())
                .build();
    }
}