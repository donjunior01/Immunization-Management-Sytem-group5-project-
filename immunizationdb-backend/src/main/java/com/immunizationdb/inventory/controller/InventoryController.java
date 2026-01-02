package com.immunizationdb.inventory.controller;

import com.immunizationdb.inventory.dto.AdjustStockRequest;
import com.immunizationdb.inventory.dto.CreateVaccineBatchRequest;
import com.immunizationdb.inventory.dto.ReceiveStockRequest;
import com.immunizationdb.inventory.dto.StockLevelResponse;
import com.immunizationdb.inventory.dto.VaccineBatchResponse;
import com.immunizationdb.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getAllBatches(
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false) String vaccine_name) {
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"InventoryController.java:25\",\"message\":\"getAllBatches called\",\"data\":{\"hasAuth\":%s,\"authorities\":\"%s\",\"facilityId\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"E\"}\n", auth != null, auth != null ? auth.getAuthorities().toString() : "null", facilityId));
            fw.close();
        } catch (Exception e) {}
        // #endregion
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

    @GetMapping("/batches/available/{facilityId}/vaccine/{vaccineName}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<VaccineBatchResponse>> getAvailableBatchesByVaccine(
            @PathVariable String facilityId,
            @PathVariable String vaccineName) {
        // Spring automatically URL-decodes path variables, but log to verify
        log.info("getAvailableBatchesByVaccine called - facilityId: {}, vaccineName: '{}'", facilityId, vaccineName);
        List<VaccineBatchResponse> batches = inventoryService.findAvailableBatchesByVaccine(facilityId, vaccineName);
        log.info("Returning {} batches for facility: {}, vaccine: '{}'", batches.size(), facilityId, vaccineName);
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

    @GetMapping("/vaccines")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getAllVaccines() {
        // Return list of available vaccine types
        List<java.util.Map<String, Object>> vaccines = new java.util.ArrayList<>();
        String[] vaccineNames = {"BCG", "OPV", "DTP", "Measles", "Hepatitis B", "Rotavirus", "COVID-19", "Tetanus", "Yellow Fever", "Meningitis"};
        
        for (String name : vaccineNames) {
            java.util.Map<String, Object> vaccine = new java.util.HashMap<>();
            vaccine.put("id", name.toLowerCase().replace(" ", "-"));
            vaccine.put("name", name);
            vaccine.put("code", name);
            vaccine.put("isActive", true);
            vaccine.put("maxDoses", getMaxDosesForVaccine(name));
            vaccines.add(vaccine);
        }
        
        return ResponseEntity.ok(vaccines);
    }

    @PostMapping("/stock/receive")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> receiveStock(@Valid @RequestBody ReceiveStockRequest request) {
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"InventoryController.java:receiveStock\",\"message\":\"receiveStock called\",\"data\":{\"username\":\"%s\",\"authorities\":\"%s\",\"batchNumber\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"STOCK_403\"}\n", 
                auth != null ? auth.getName() : "null", 
                auth != null ? auth.getAuthorities().toString() : "null",
                request.getBatchNumber()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        VaccineBatchResponse response = inventoryService.receiveStock(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/stock/adjust")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> adjustStock(@Valid @RequestBody AdjustStockRequest request) {
        // This method should only be reached if PreAuthorize passes
        // #region agent log
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = auth != null ? auth.getName() : "null";
            String authorities = auth != null ? auth.getAuthorities().toString() : "null";
            boolean isAuthenticated = auth != null && auth.isAuthenticated();
            java.io.FileWriter fw = new java.io.FileWriter("c:\\Users\\THE TECHNOLOGUE\\Documents\\INGE-4-ISI-2025-2026\\SEMESTER-1\\Mobile Development\\Project\\medConnect\\Immunization-Management-Sytem-group5-project-\\.cursor\\debug.log", true);
            fw.write(String.format("{\"location\":\"InventoryController.java:adjustStock\",\"message\":\"adjustStock called - PreAuthorize passed\",\"data\":{\"hasAuth\":%s,\"isAuthenticated\":%s,\"username\":\"%s\",\"authorities\":\"%s\",\"batchNumber\":\"%s\"},\"timestamp\":%d,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"STOCK_403\"}\n", 
                auth != null,
                isAuthenticated,
                username,
                authorities,
                request.getBatchNumber()));
            fw.close();
        } catch (Exception e) {}
        // #endregion
        VaccineBatchResponse response = inventoryService.adjustStock(request);
        return ResponseEntity.ok(response);
    }

    private int getMaxDosesForVaccine(String vaccineName) {
        return switch (vaccineName) {
            case "BCG" -> 1;
            case "OPV" -> 4;
            case "DTP" -> 3;
            case "Measles" -> 2;
            case "Hepatitis B" -> 3;
            case "Rotavirus" -> 2;
            case "COVID-19" -> 3;
            case "Tetanus" -> 5;
            case "Yellow Fever" -> 1;
            case "Meningitis" -> 1;
            default -> 1;
        };
    }
}
