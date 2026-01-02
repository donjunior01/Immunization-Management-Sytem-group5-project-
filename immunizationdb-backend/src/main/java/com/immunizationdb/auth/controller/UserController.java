package com.immunizationdb.auth.controller;

import com.immunizationdb.auth.dto.RegisterRequest;
import com.immunizationdb.auth.dto.UpdateProfileRequest;
import com.immunizationdb.auth.dto.UserResponse;
import com.immunizationdb.auth.entity.User;
import com.immunizationdb.auth.repository.UserRepository;
import com.immunizationdb.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    /**
     * Get staff members for the current user's facility
     * GET /api/users/facility/staff
     */
    @GetMapping("/facility/staff")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<UserResponse>> getFacilityStaff(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            // Get current user to find their facility
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            String facilityId = currentUser.getFacilityId();
            if (facilityId == null || facilityId.trim().isEmpty()) {
                log.warn("User {} does not have a facility assigned", currentUser.getUsername());
                return ResponseEntity.ok(List.of());
            }

            // Find all active users in the same facility (excluding deleted users)
            List<User> staff = userRepository.findByFacilityIdAndDeletedFalseAndActiveTrue(facilityId);

            List<UserResponse> staffResponse = staff.stream()
                    .map(UserResponse::fromUser)
                    .collect(Collectors.toList());

            log.info("Retrieved {} staff members for facility {}", staffResponse.size(), facilityId);
            return ResponseEntity.ok(staffResponse);

        } catch (Exception e) {
            log.error("Error fetching facility staff", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create a new staff member
     * POST /api/users
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<?> createStaff(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RegisterRequest request) {
        try {
            // Get current user to set facility ID
            User currentUser = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            // Use register method from AuthService which handles password encoding
            RegisterRequest registerRequest = RegisterRequest.builder()
                    .username(request.getUsername())
                    .password(request.getPassword())
                    .email(request.getEmail())
                    .fullName(request.getFullName())
                    .role(request.getRole())
                    .build();

            UserResponse response = authService.register(registerRequest);
            
            // Set facility ID from current user
            User createdUser = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new IllegalArgumentException("Failed to create user"));
            createdUser.setFacilityId(currentUser.getFacilityId());
            createdUser = userRepository.save(createdUser);

            log.info("New staff member created: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.fromUser(createdUser));

        } catch (IllegalArgumentException e) {
            log.error("Error creating staff member", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating staff member", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Update a staff member
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<?> updateStaff(
            @PathVariable String id,
            @Valid @RequestBody UpdateProfileRequest request) {
        try {
            UserResponse response = authService.updateProfile(id, request);
            log.info("Staff member updated: {}", id);
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Error updating staff member", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating staff member", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Deactivate a staff member
     * PUT /api/users/{id}/deactivate
     */
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<?> deactivateStaff(@PathVariable String id) {
        try {
            User user = userRepository.findById(Long.valueOf(id))
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            user.setActive(false);
            user = userRepository.save(user);

            log.info("Staff member deactivated: {}", id);
            return ResponseEntity.ok(UserResponse.fromUser(user));

        } catch (IllegalArgumentException e) {
            log.error("Error deactivating staff member", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deactivating staff member", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

