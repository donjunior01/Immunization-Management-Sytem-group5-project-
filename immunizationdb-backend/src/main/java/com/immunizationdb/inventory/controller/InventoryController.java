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
@RequestMapping("/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/batches")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> createBatch(@Valid @RequestBody CreateVaccineBatchRequest request) {
        VaccineBatchResponse response = inventoryService.createBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/batches/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getBatchesByFacility(@PathVariable String facilityId) {
        List<VaccineBatchResponse> batches = inventoryService.getBatchesByFacility(facilityId);
        return ResponseEntity.ok(batches);
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
