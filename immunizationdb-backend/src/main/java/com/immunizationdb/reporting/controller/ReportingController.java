package com.immunizationdb.reporting.controller;

import com.immunizationdb.reporting.dto.*;
import com.immunizationdb.reporting.service.ReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReportingController {

    private final ReportingService reportingService;

    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStatsSimple() {
        // Default to facility "FAC-001" for now
        DashboardStatsResponse stats = reportingService.getDashboardStats("FAC-001");
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/national-stats")
    @PreAuthorize("hasRole('GOVERNMENT_OFFICIAL')")
    public ResponseEntity<NationalStatisticsResponse> getNationalStatistics() {
        NationalStatisticsResponse stats = reportingService.getNationalStatistics();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/dashboard/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(@PathVariable String facilityId) {
        DashboardStatsResponse stats = reportingService.getDashboardStats(facilityId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/coverage")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<CoverageReportResponse> getCoverageReport(
            @RequestParam(required = false) String facility_id,
            @RequestParam(required = false) String facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start_date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end_date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        // Support both snake_case and camelCase parameter names
        String finalFacilityId = facility_id != null ? facility_id : (facilityId != null ? facilityId : null);
        LocalDate finalStartDate = start_date != null ? start_date : startDate;
        LocalDate finalEndDate = end_date != null ? end_date : endDate;
        
        // Default to last 30 days if dates not provided
        if (finalStartDate == null) {
            finalStartDate = LocalDate.now().minusDays(30);
        }
        if (finalEndDate == null) {
            finalEndDate = LocalDate.now();
        }
        
        CoverageReportResponse report = reportingService.getCoverageReport(finalFacilityId, finalStartDate, finalEndDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<StockReportResponse> getStockReport(@RequestParam String facilityId) {
        StockReportResponse report = reportingService.getStockReport(facilityId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/facility-comparison")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<FacilityComparisonResponse> getFacilityComparison(
            @RequestParam List<String> facilityIds) {
        FacilityComparisonResponse report = reportingService.getFacilityComparison(facilityIds);
        return ResponseEntity.ok(report);
    }
}

