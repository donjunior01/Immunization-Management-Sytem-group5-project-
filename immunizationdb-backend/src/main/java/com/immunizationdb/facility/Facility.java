package com.immunizationdb.facility;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "facilities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Facility {
    
    @Id
    @Column(name = "id", length = 50)
    private String id;
    
    @NotBlank(message = "Facility name is required")
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;
    
    @NotBlank(message = "Facility type is required")
    @Size(max = 50)
    @Column(name = "type", nullable = false)
    private String type; // HOSPITAL, HEALTH_CENTER, CLINIC
    
    @Size(max = 50)
    @Column(name = "district_id")
    private String districtId;
    
    @Size(max = 100)
    @Column(name = "county")
    private String county;
    
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;
    
    @Size(max = 20)
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Email(message = "Invalid email format")
    @Size(max = 255)
    @Column(name = "email")
    private String email;
    
    @Column(name = "capacity")
    private Integer capacity;
    
    @Column(name = "active", nullable = false)
    private Boolean active = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (active == null) {
            active = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
