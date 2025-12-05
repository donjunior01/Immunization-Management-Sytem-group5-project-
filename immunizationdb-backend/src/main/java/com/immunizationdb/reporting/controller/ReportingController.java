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
@RequestMapping("/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ReportingController {

    private final ReportingService reportingService;

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
            @RequestParam String facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CoverageReportResponse report = reportingService.getCoverageReport(facilityId, startDate, endDate);
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
