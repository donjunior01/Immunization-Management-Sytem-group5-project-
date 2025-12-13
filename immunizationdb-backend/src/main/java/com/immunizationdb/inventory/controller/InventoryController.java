package com.immunizationdb.inventory.controller;

import com.immunizationdb.inventory.dto.CreateVaccineBatchRequest;
import com.immunizationdb.inventory.dto.VaccineBatchResponse;
import com.immunizationdb.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getAllBatches(
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false) String vaccine_name) {
        List<VaccineBatchResponse> batches;
        
        if (facilityId != null) {
            batches = inventoryService.getBatchesByFacility(facilityId);
        } else {
            batches = inventoryService.getAllBatches();
        }
        
        // Filter by vaccine name if specified
        if (vaccine_name != null && !vaccine_name.isEmpty()) {
            batches = batches.stream()
                    .filter(b -> b.getVaccineName().equalsIgnoreCase(vaccine_name))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/batches/{id}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> getBatchById(@PathVariable Long id) {
        VaccineBatchResponse batch = inventoryService.getBatchById(id);
        return ResponseEntity.ok(batch);
    }

    @PostMapping("/batches")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> createBatch(@Valid @RequestBody CreateVaccineBatchRequest request) {
        VaccineBatchResponse response = inventoryService.createBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/batches/{id}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody CreateVaccineBatchRequest request) {
        VaccineBatchResponse response = inventoryService.updateBatch(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/batches/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getBatchesByFacility(@PathVariable String facilityId) {
        List<VaccineBatchResponse> batches = inventoryService.getBatchesByFacility(facilityId);
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/batches/expiring")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getExpiringBatches(
            @RequestParam(required = false) String facilityId,
            @RequestParam(defaultValue = "30") int days) {
        // For now, if facilityId is provided, get expiring for that facility
        // Otherwise return empty list (would need to add getAllExpiringBatches to service)
        if (facilityId != null) {
            List<VaccineBatchResponse> batches = inventoryService.getExpiringSoonBatches(facilityId);
            return ResponseEntity.ok(batches);
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/batches/low-stock")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getLowStockBatches(
            @RequestParam(defaultValue = "100") int threshold) {
        // Get all batches and filter by quantity
        List<VaccineBatchResponse> allBatches = inventoryService.getAllBatches();
        List<VaccineBatchResponse> lowStock = allBatches.stream()
                .filter(b -> b.getQuantityRemaining() < threshold)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(lowStock);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<java.util.Map<String, Object>> getDashboardStats() {
        List<VaccineBatchResponse> allBatches = inventoryService.getAllBatches();
        
        java.util.Set<String> vaccineTypes = new java.util.HashSet<>();
        int totalDoses = 0;
        int lowStockItems = 0;
        int expiringSoon = 0;
        
        java.time.LocalDate now = java.time.LocalDate.now();
        java.time.LocalDate thirtyDaysLater = now.plusDays(30);
        
        for (VaccineBatchResponse batch : allBatches) {
            vaccineTypes.add(batch.getVaccineName());
            totalDoses += batch.getQuantityRemaining();
            
            if (batch.getQuantityRemaining() < 100) {
                lowStockItems++;
            }
            
            if (batch.getExpiryDate().isAfter(now) && batch.getExpiryDate().isBefore(thirtyDaysLater)) {
                expiringSoon++;
            }
        }
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalVaccineTypes", vaccineTypes.size());
        stats.put("totalDoses", totalDoses);
        stats.put("lowStockItems", lowStockItems);
        stats.put("expiringSoon", expiringSoon);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/batches/available/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getAvailableBatches(@PathVariable String facilityId) {
        List<VaccineBatchResponse> batches = inventoryService.getAvailableBatches(facilityId);
        return ResponseEntity.ok(batches);
    }

    @GetMapping("/batches/expiring-soon/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getExpiringSoonBatches(@PathVariable String facilityId) {
        List<VaccineBatchResponse> batches = inventoryService.getExpiringSoonBatches(facilityId);
        return ResponseEntity.ok(batches);
    }

    @DeleteMapping("/batches/{batchId}")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long batchId) {
        inventoryService.deleteBatch(batchId);
        return ResponseEntity.noContent().build();
    }
}
