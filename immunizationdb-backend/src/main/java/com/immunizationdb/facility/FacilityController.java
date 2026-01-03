package com.immunizationdb.facility;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class FacilityController {
    
    private final FacilityService facilityService;
    
    @GetMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<Facility>> getAllFacilities(
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly) {
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"FacilityController.java:24\",\"message\":\"getAllFacilities called\",\"data\":{\"hasAuth\":%s,\"authorities\":\"%s\",\"principal\":\"%s\",\"activeOnly\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"B\"}\n", auth != null, auth != null ? auth.getAuthorities().toString() : "null", auth != null ? auth.getPrincipal().toString() : "null", activeOnly));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        log.info("GET /api/facilities - activeOnly: {}", activeOnly);
        
        List<Facility> facilities = activeOnly ? 
                facilityService.getAllActiveFacilities() : 
                facilityService.getAllFacilities();
        
        return ResponseEntity.ok(facilities);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Facility> getFacilityById(@PathVariable String id) {
        log.info("GET /api/facilities/{}", id);
        
        return facilityService.getFacilityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/district/{districtId}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<Facility>> getFacilitiesByDistrict(@PathVariable String districtId) {
        log.info("GET /api/facilities/district/{}", districtId);
        return ResponseEntity.ok(facilityService.getFacilitiesByDistrict(districtId));
    }
    
    @GetMapping("/county/{county}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<Facility>> getFacilitiesByCounty(@PathVariable String county) {
        log.info("GET /api/facilities/county/{}", county);
        return ResponseEntity.ok(facilityService.getFacilitiesByCounty(county));
    }
    
    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<Facility>> getFacilitiesByType(@PathVariable String type) {
        log.info("GET /api/facilities/type/{}", type);
        return ResponseEntity.ok(facilityService.getFacilitiesByType(type));
    }
    
    @PostMapping
    @PreAuthorize("hasRole('GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Facility> createFacility(@Valid @RequestBody Facility facility) {
        log.info("POST /api/facilities - Creating facility: {}", facility.getName());
        
        try {
            Facility created = facilityService.createFacility(facility);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.error("Error creating facility: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Facility> updateFacility(
            @PathVariable String id,
            @Valid @RequestBody Facility facility) {
        log.info("PUT /api/facilities/{} - Updating facility", id);
        
        try {
            Facility updated = facilityService.updateFacility(id, facility);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.error("Error updating facility: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Void> deleteFacility(@PathVariable String id) {
        log.info("DELETE /api/facilities/{} - Soft deleting facility", id);
        
        try {
            facilityService.deleteFacility(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Error deleting facility: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/stats/count")
    @PreAuthorize("hasRole('GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Long> countActiveFacilities() {
        log.info("GET /api/facilities/stats/count");
        return ResponseEntity.ok(facilityService.countActiveFacilities());
    }
}

