package com.immunizationdb.inventory.controller;

import com.immunizationdb.inventory.dto.AdjustStockRequest;
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
@RequestMapping("/v1/stock")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class StockController {

    private final InventoryService inventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<StockLevelResponse>> getStockLevels(
            @RequestParam(required = false) String facility_id) {
        // Support both facility_id and facilityId for backward compatibility
        String facilityId = facility_id;
        if (facilityId == null || facilityId.isEmpty()) {
            // Try to get from authenticated user if not provided
            try {
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof com.immunizationdb.auth.entity.User) {
                    com.immunizationdb.auth.entity.User user = 
                        (com.immunizationdb.auth.entity.User) auth.getPrincipal();
                    facilityId = user.getFacilityId();
                }
            } catch (Exception e) {
                log.warn("Could not get facility ID from authenticated user", e);
            }
        }
        
        if (facilityId == null || facilityId.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        List<StockLevelResponse> stockLevels = inventoryService.getStockLevels(facilityId);
        return ResponseEntity.ok(stockLevels);
    }

    @PostMapping("/receive")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> receiveStock(@Valid @RequestBody ReceiveStockRequest request) {
        try {
            VaccineBatchResponse response = inventoryService.receiveStock(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error receiving stock", e);
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<VaccineBatchResponse> adjustStock(@Valid @RequestBody AdjustStockRequest request) {
        try {
            VaccineBatchResponse response = inventoryService.adjustStock(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error adjusting stock", e);
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        }
    }
}

