package com.immunizationdb.reporting.controller;

import com.immunizationdb.reporting.dto.*;
import com.immunizationdb.reporting.service.ReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @PostMapping("/export")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<byte[]> exportReport(
            @RequestBody(required = false) ExportRequest request) {
        // Handle request body or query params
        String facilityId = request != null ? request.getFacilityId() : null;
        LocalDate startDate = request != null && request.getStartDate() != null 
            ? LocalDate.parse(request.getStartDate()) 
            : LocalDate.now().minusDays(30);
        LocalDate endDate = request != null && request.getEndDate() != null 
            ? LocalDate.parse(request.getEndDate()) 
            : LocalDate.now();
        
        // Get coverage report data
        CoverageReportResponse report = reportingService.getCoverageReport(facilityId, startDate, endDate);
        
        // Generate CSV content
        StringBuilder csv = new StringBuilder();
        csv.append("Coverage Report\n");
        csv.append("Facility ID,").append(facilityId != null ? facilityId : "ALL").append("\n");
        csv.append("Start Date,").append(startDate).append("\n");
        csv.append("End Date,").append(endDate).append("\n\n");
        
        csv.append("Summary\n");
        csv.append("Total Patients Registered,").append(report.getTotalPatientsRegistered()).append("\n");
        csv.append("Target Population,").append(report.getTargetPopulation()).append("\n");
        csv.append("Vaccinated Count,").append(report.getVaccinatedCount()).append("\n");
        csv.append("Coverage Percentage,").append(String.format("%.2f", report.getCoveragePercentage())).append("%\n");
        csv.append("Penta1-Penta3 Dropout Rate,").append(String.format("%.2f", report.getPenta1Penta3DropoutRate())).append("%\n\n");
        
        csv.append("Vaccinations by Vaccine Type\n");
        csv.append("Vaccine Name,Count\n");
        for (CoverageReportResponse.VaccinationByVaccineType v : report.getVaccinationsByVaccineType()) {
            csv.append(v.getVaccineName()).append(",").append(v.getCount()).append("\n");
        }
        
        byte[] csvBytes = csv.toString().getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", 
            "coverage-report-" + startDate + "-" + endDate + ".csv");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(csvBytes);
    }
    
    // Inner class for request body
    public static class ExportRequest {
        private String facilityId;
        private String startDate;
        private String endDate;
        
        public String getFacilityId() { return facilityId; }
        public void setFacilityId(String facilityId) { this.facilityId = facilityId; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
    }
}

