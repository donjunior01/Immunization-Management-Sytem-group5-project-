package com.immunizationdb.reporting.service;

import com.immunizationdb.campaign.repository.CampaignRepository;
import com.immunizationdb.inventory.entity.VaccineBatch;
import com.immunizationdb.inventory.repository.VaccineBatchRepository;
import com.immunizationdb.patient.repository.PatientRepository;
import com.immunizationdb.reporting.dto.*;
import com.immunizationdb.vaccination.repository.VaccinationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportingService {

    private final PatientRepository patientRepository;
    private final VaccinationRepository vaccinationRepository;
    private final VaccineBatchRepository vaccineBatchRepository;
    private final CampaignRepository campaignRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String facilityId) {
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);

        Long totalPatients = patientRepository.countByFacilityId(facilityId);
        Long vaccinationsThisMonth = vaccinationRepository.countByFacilityIdAndDateRange(
                facilityId, startOfMonth, now);
        
        Integer availableBatches = vaccineBatchRepository.findAvailableBatches(facilityId, now).size();
        Integer expiringBatches = vaccineBatchRepository.findBatchesExpiringSoon(
                facilityId, now, now.plusDays(30)).size();
        
        Long activeCampaigns = (long) campaignRepository.findActiveCampaignsByFacility(facilityId, now).size();

        return DashboardStatsResponse.builder()
                .totalPatients(totalPatients)
                .vaccinationsThisMonth(vaccinationsThisMonth)
                .availableBatches(availableBatches)
                .expiringBatches(expiringBatches)
                .activeCampaigns(activeCampaigns)
                .coverageRate(0.0) // To be calculated based on target population
                .pendingSyncItems(0L)
                .build();
    }

    @Transactional(readOnly = true)
    public CoverageReportResponse getCoverageReport(String facilityId, LocalDate startDate, LocalDate endDate) {
        log.info("Generating coverage report for facility: {}, from {} to {}", facilityId, startDate, endDate);
        
        // Handle null facilityId - use all facilities or default
        boolean isAllFacilities = (facilityId == null || facilityId.trim().isEmpty() || facilityId.equals("ALL"));
        
        // Total patients registered (all patients in facility, not just in date range)
        Long totalPatientsRegistered = isAllFacilities ? 
            patientRepository.count() : 
            patientRepository.countByFacilityId(facilityId);
        
        // Target population (estimated based on facility size or use default)
        Long targetPopulation = totalPatientsRegistered > 0 ? totalPatientsRegistered * 2L : 5000L;
        
        // Vaccinations by vaccine type
        List<Object[]> vaccineStats = isAllFacilities ?
            vaccinationRepository.findAll().stream()
                .filter(v -> !v.getDateAdministered().isBefore(startDate) && !v.getDateAdministered().isAfter(endDate))
                .collect(Collectors.groupingBy(
                    v -> v.getVaccineName(),
                    Collectors.counting()
                ))
                .entrySet().stream()
                .map(e -> new Object[]{e.getKey(), e.getValue()})
                .collect(Collectors.toList()) :
            vaccinationRepository.getVaccinationStatsByVaccine(facilityId, startDate, endDate);
        List<CoverageReportResponse.VaccinationByVaccineType> vaccinationsByVaccineType = vaccineStats.stream()
                .map(stat -> CoverageReportResponse.VaccinationByVaccineType.builder()
                        .vaccineName((String) stat[0])
                        .count((Long) stat[1])
                        .build())
                .collect(Collectors.toList());
        
        // Calculate Penta1/Penta3 dropout rate
        Long penta1Dose1Count = isAllFacilities ?
            vaccinationRepository.findAll().stream()
                .filter(v -> (v.getVaccineName().equalsIgnoreCase("Penta") || v.getVaccineName().equalsIgnoreCase("DTP")))
                .filter(v -> v.getDoseNumber() == 1)
                .filter(v -> !v.getDateAdministered().isBefore(startDate) && !v.getDateAdministered().isAfter(endDate))
                .count() :
            vaccinationRepository.countPentaDoseByFacilityAndDateRange(facilityId, 1, startDate, endDate);
        
        Long penta3Dose3Count = isAllFacilities ?
            vaccinationRepository.findAll().stream()
                .filter(v -> (v.getVaccineName().equalsIgnoreCase("Penta") || v.getVaccineName().equalsIgnoreCase("DTP")))
                .filter(v -> v.getDoseNumber() == 3)
                .filter(v -> !v.getDateAdministered().isBefore(startDate) && !v.getDateAdministered().isAfter(endDate))
                .count() :
            vaccinationRepository.countPentaDoseByFacilityAndDateRange(facilityId, 3, startDate, endDate);
        
        Double penta1Penta3DropoutRate = 0.0;
        if (penta1Dose1Count > 0) {
            penta1Penta3DropoutRate = ((penta1Dose1Count - penta3Dose3Count) * 100.0) / penta1Dose1Count;
        }
        
        // Coverage percentage (vaccinated/target population)
        Long vaccinatedCount = isAllFacilities ?
            vaccinationRepository.findAll().stream()
                .filter(v -> !v.getDateAdministered().isBefore(startDate) && !v.getDateAdministered().isAfter(endDate))
                .count() :
            vaccinationRepository.countByFacilityIdAndDateRange(facilityId, startDate, endDate);
        Double coveragePercentage = targetPopulation > 0 ? (vaccinatedCount * 100.0) / targetPopulation : 0.0;
        
        // Calculate summary statistics
        Double facilityCoverage = coveragePercentage;
        Double districtCoverage = 85.2; // Calculate from district-level data
        Double nationalCoverage = 87.5; // Calculate from national-level data
        Double targetVsAchieved = targetPopulation > 0 ? (vaccinatedCount * 100.0) / targetPopulation : 0.0;
        
        CoverageReportResponse.SummaryStats summaryStats = CoverageReportResponse.SummaryStats.builder()
                .nationalCoverage(nationalCoverage)
                .districtCoverage(districtCoverage)
                .facilityCoverage(facilityCoverage)
                .targetVsAchieved(targetVsAchieved)
                .build();

        // Generate vaccine-specific data
        List<CoverageReportResponse.VaccineData> vaccineData = generateVaccineData(
            isAllFacilities ? null : facilityId, startDate, endDate);
        
        // Generate trend data for last 6 months
        List<CoverageReportResponse.TrendData> trendData = generateTrendData(
            isAllFacilities ? null : facilityId, endDate);
        
        return CoverageReportResponse.builder()
                .totalPatientsRegistered(totalPatientsRegistered)
                .vaccinationsByVaccineType(vaccinationsByVaccineType)
                .penta1Penta3DropoutRate(penta1Penta3DropoutRate)
                .coveragePercentage(coveragePercentage)
                .targetPopulation(targetPopulation)
                .vaccinatedCount(vaccinatedCount)
                .summaryStats(summaryStats)
                .vaccineData(vaccineData)
                .trendData(trendData)
                .build();
    }

    @Transactional(readOnly = true)
    public StockReportResponse getStockReport(String facilityId) {
        log.info("Generating stock report for facility: {}", facilityId);
        
        LocalDate now = LocalDate.now();
        List<VaccineBatch> allBatches = vaccineBatchRepository.findByFacilityId(facilityId);
        
        int totalVaccines = allBatches.size();
        int lowStock = (int) allBatches.stream()
                .filter(b -> b.getQuantityRemaining() < 50 && b.getQuantityRemaining() > 0)
                .count();
        int expiringSoon = (int) allBatches.stream()
                .filter(b -> b.getExpiryDate().isAfter(now) && 
                             b.getExpiryDate().isBefore(now.plusDays(30)))
                .count();
        int expired = (int) allBatches.stream()
                .filter(b -> b.getExpiryDate().isBefore(now))
                .count();
        
        StockReportResponse.SummaryStats summaryStats = StockReportResponse.SummaryStats.builder()
                .totalVaccines(totalVaccines)
                .lowStock(lowStock)
                .expiringSoon(expiringSoon)
                .expired(expired)
                .build();

        // Generate stock items
        List<StockReportResponse.StockItem> stockItems = allBatches.stream()
                .map(batch -> {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(now, batch.getExpiryDate());
                    String status = determineStockStatus(batch, now);
                    
                    return StockReportResponse.StockItem.builder()
                            .vaccine(batch.getVaccineName())
                            .batchNumber(batch.getBatchNumber())
                            .quantity(batch.getQuantityRemaining())
                            .expiryDate(batch.getExpiryDate())
                            .status(status)
                            .daysUntilExpiry((int) daysUntilExpiry)
                            .location(batch.getFacilityId())
                            .build();
                })
                .collect(Collectors.toList());

        // Generate alerts
        List<StockReportResponse.StockAlert> alerts = generateStockAlerts(allBatches, now);
        
        return StockReportResponse.builder()
                .summaryStats(summaryStats)
                .stockItems(stockItems)
                .alerts(alerts)
                .build();
    }

    @Transactional(readOnly = true)
    public FacilityComparisonResponse getFacilityComparison(List<String> facilityIds) {
        log.info("Generating facility comparison for facilities: {}", facilityIds);
        
        LocalDate now = LocalDate.now();
        List<FacilityComparisonResponse.FacilityData> facilities = new ArrayList<>();
        
        for (String facilityId : facilityIds) {
            Long totalVaccinations = vaccinationRepository.countByFacilityId(facilityId);
            Long totalPatients = patientRepository.countByFacilityId(facilityId);
            Double coverageRate = totalPatients > 0 ? (totalVaccinations * 100.0) / totalPatients : 0.0;
            
            Integer availableStock = vaccineBatchRepository.findAvailableBatches(facilityId, now).size();
            String stockStatus = availableStock > 10 ? "Good" : availableStock > 5 ? "Low" : "Critical";
            
            FacilityComparisonResponse.FacilityData facilityData = FacilityComparisonResponse.FacilityData.builder()
                    .id(Long.valueOf(facilityId.hashCode()))
                    .name("Facility " + facilityId)
                    .district("District " + facilityId.substring(0, 3))
                    .totalVaccinations(totalVaccinations.intValue())
                    .coverageRate(coverageRate)
                    .stockStatus(stockStatus)
                    .staffCount(15 + (facilityId.hashCode() % 10))
                    .lastUpdated(now.atStartOfDay())
                    .rank(calculateFacilityRank(coverageRate, availableStock))
                    .build();
            
            facilities.add(facilityData);
        }
        
        // Generate comparison metrics
        List<FacilityComparisonResponse.ComparisonMetric> comparisonMetrics = generateComparisonMetrics(facilities);
        
        // Generate best practices
        List<FacilityComparisonResponse.BestPractice> bestPractices = generateBestPractices(facilities);
        
        return FacilityComparisonResponse.builder()
                .facilities(facilities)
                .comparisonMetrics(comparisonMetrics)
                .bestPractices(bestPractices)
                .build();
    }

    private List<CoverageReportResponse.VaccineData> generateVaccineData(String facilityId, LocalDate startDate, LocalDate endDate) {
        String[] vaccines = {"BCG", "Polio", "DTP", "Measles", "COVID-19"};
        List<CoverageReportResponse.VaccineData> vaccineDataList = new ArrayList<>();
        boolean isAllFacilities = (facilityId == null || facilityId.trim().isEmpty());
        
        for (String vaccine : vaccines) {
            Long achieved = isAllFacilities ?
                vaccinationRepository.findAll().stream()
                    .filter(v -> v.getVaccineName().equalsIgnoreCase(vaccine))
                    .filter(v -> !v.getDateAdministered().isBefore(startDate) && !v.getDateAdministered().isAfter(endDate))
                    .count() :
                vaccinationRepository.countByVaccineAndDateRange(facilityId, vaccine, startDate, endDate);
            Integer target = 1000; // Should come from target data
            Double coverage = (achieved * 100.0) / target;
            String trend = coverage > 90 ? "up" : coverage > 70 ? "stable" : "down";
            
            List<CoverageReportResponse.AgeGroupData> ageGroups = Arrays.asList(
                    CoverageReportResponse.AgeGroupData.builder()
                            .ageGroup("Infants (0-1 years)")
                            .target(300)
                            .achieved((int) (achieved * 0.3))
                            .coverage(coverage * 0.3)
                            .build(),
                    CoverageReportResponse.AgeGroupData.builder()
                            .ageGroup("Toddlers (1-3 years)")
                            .target(300)
                            .achieved((int) (achieved * 0.3))
                            .coverage(coverage * 0.3)
                            .build()
            );
            
            vaccineDataList.add(CoverageReportResponse.VaccineData.builder()
                    .vaccine(vaccine)
                    .target(target)
                    .achieved(achieved.intValue())
                    .coverage(coverage)
                    .trend(trend)
                    .children(ageGroups)
                    .build());
        }
        
        return vaccineDataList;
    }

    private List<CoverageReportResponse.TrendData> generateTrendData(String facilityId, LocalDate endDate) {
        List<CoverageReportResponse.TrendData> trendData = new ArrayList<>();
        boolean isAllFacilities = (facilityId == null || facilityId.trim().isEmpty());
        
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.from(endDate.minusMonths(i));
            LocalDate monthStart = month.atDay(1);
            LocalDate monthEnd = month.atEndOfMonth();
            
            Long vaccinations = isAllFacilities ?
                vaccinationRepository.findAll().stream()
                    .filter(v -> !v.getDateAdministered().isBefore(monthStart) && !v.getDateAdministered().isAfter(monthEnd))
                    .count() :
                vaccinationRepository.countByFacilityIdAndDateRange(facilityId, monthStart, monthEnd);
            Double coverage = (vaccinations * 100.0) / 1000; // Should use actual target
            
            trendData.add(CoverageReportResponse.TrendData.builder()
                    .month(month.getMonth().toString() + " " + month.getYear())
                    .coverage(coverage)
                    .build());
        }
        
        return trendData;
    }

    private String determineStockStatus(VaccineBatch batch, LocalDate now) {
        if (batch.getExpiryDate().isBefore(now)) {
            return "expired";
        } else if (batch.getExpiryDate().isBefore(now.plusDays(30))) {
            return "expiring-soon";
        } else if (batch.getQuantityRemaining() < 50) {
            return "low-stock";
        } else {
            return "in-stock";
        }
    }

    private List<StockReportResponse.StockAlert> generateStockAlerts(List<VaccineBatch> batches, LocalDate now) {
        List<StockReportResponse.StockAlert> alerts = new ArrayList<>();
        
        batches.stream()
                .filter(b -> b.getQuantityRemaining() < 50 && b.getQuantityRemaining() > 0)
                .forEach(b -> alerts.add(StockReportResponse.StockAlert.builder()
                        .type("low-stock")
                        .vaccine(b.getVaccineName())
                        .message("Low stock level: Only " + b.getQuantityRemaining() + " doses remaining")
                        .severity("error")
                        .build()));
        
        batches.stream()
                .filter(b -> b.getExpiryDate().isAfter(now) && b.getExpiryDate().isBefore(now.plusDays(30)))
                .forEach(b -> alerts.add(StockReportResponse.StockAlert.builder()
                        .type("expiring-soon")
                        .vaccine(b.getVaccineName())
                        .message("Batch " + b.getBatchNumber() + " expiring on " + b.getExpiryDate())
                        .severity("warning")
                        .build()));
        
        batches.stream()
                .filter(b -> b.getExpiryDate().isBefore(now))
                .forEach(b -> alerts.add(StockReportResponse.StockAlert.builder()
                        .type("expired")
                        .vaccine(b.getVaccineName())
                        .message("Batch " + b.getBatchNumber() + " has expired")
                        .severity("error")
                        .build()));
        
        return alerts;
    }

    private Integer calculateFacilityRank(Double coverageRate, Integer stockLevel) {
        if (coverageRate > 90 && stockLevel > 10) return 5;
        if (coverageRate > 80 && stockLevel > 7) return 4;
        if (coverageRate > 70 && stockLevel > 5) return 3;
        if (coverageRate > 60 && stockLevel > 3) return 2;
        return 1;
    }

    private List<FacilityComparisonResponse.ComparisonMetric> generateComparisonMetrics(
            List<FacilityComparisonResponse.FacilityData> facilities) {
        List<FacilityComparisonResponse.ComparisonMetric> metrics = new ArrayList<>();
        
        // Total Vaccinations
        Map<String, String> vaccinationsMap = new HashMap<>();
        for (int i = 0; i < facilities.size(); i++) {
            vaccinationsMap.put("facility" + (i + 1), String.valueOf(facilities.get(i).getTotalVaccinations()));
        }
        metrics.add(FacilityComparisonResponse.ComparisonMetric.builder()
                .metric("Total Vaccinations")
                .facilityValues(vaccinationsMap)
                .build());
        
        // Coverage Rate
        Map<String, String> coverageMap = new HashMap<>();
        for (int i = 0; i < facilities.size(); i++) {
            coverageMap.put("facility" + (i + 1), String.format("%.1f%%", facilities.get(i).getCoverageRate()));
        }
        metrics.add(FacilityComparisonResponse.ComparisonMetric.builder()
                .metric("Coverage Rate")
                .facilityValues(coverageMap)
                .build());
        
        return metrics;
    }

    private List<FacilityComparisonResponse.BestPractice> generateBestPractices(
            List<FacilityComparisonResponse.FacilityData> facilities) {
        List<FacilityComparisonResponse.BestPractice> practices = new ArrayList<>();
        
        // Find facility with highest coverage
        facilities.stream()
                .max(Comparator.comparing(FacilityComparisonResponse.FacilityData::getCoverageRate))
                .ifPresent(f -> practices.add(FacilityComparisonResponse.BestPractice.builder()
                        .facility(f.getName())
                        .practice("Automated inventory management system")
                        .impact("High")
                        .build()));
        
        return practices;
    }

    @Transactional(readOnly = true)
    public NationalStatisticsResponse getNationalStatistics() {
        LocalDate now = LocalDate.now();
        LocalDate thirtyDaysFromNow = now.plusDays(30);
        
        // Count all facilities (in real implementation, query from facilities table)
        List<String> allFacilityIds = List.of("FAC001", "FAC002", "FAC003");
        Integer totalFacilities = 3;
        
        // Count total vaccine types
        Integer totalVaccineTypes = 8;
        
        // Aggregate doses available across all facilities
        Integer totalDosesAvailable = vaccineBatchRepository.findAll().stream()
                .mapToInt(b -> b.getQuantityRemaining())
                .sum();
        
        // Count total patients registered across all facilities
        Long totalPatientsRegistered = patientRepository.count();
        
        // Count total vaccinations administered across all facilities
        Long totalVaccinationsAdministered = vaccinationRepository.count();
        
        // Count active campaigns across all facilities
        Integer activeCampaigns = campaignRepository.findActiveCampaigns(now).size();
        
        // Count low stock alerts (batches with < 50 doses remaining)
        Integer lowStockAlerts = (int) vaccineBatchRepository.findAll().stream()
                .filter(b -> b.getQuantityRemaining() < 50 && b.getQuantityRemaining() > 0)
                .count();
        
        // Count expiring batches (expiring within 30 days)
        Integer expiringBatches = (int) vaccineBatchRepository.findAll().stream()
                .filter(b -> b.getExpiryDate().isAfter(now) && b.getExpiryDate().isBefore(thirtyDaysFromNow))
                .count();
        
        // Calculate national coverage rate
        Double coverageRate = totalPatientsRegistered > 0 
                ? (totalVaccinationsAdministered * 100.0) / totalPatientsRegistered 
                : 0.0;
        
        // Count facilities with alerts
        Integer facilitiesWithAlerts = (int) allFacilityIds.stream()
                .filter(facilityId -> {
                    List<VaccineBatch> batches = vaccineBatchRepository.findByFacilityId(facilityId);
                    return batches.stream().anyMatch(b -> 
                        b.getQuantityRemaining() < 50 || 
                        (b.getExpiryDate().isAfter(now) && b.getExpiryDate().isBefore(thirtyDaysFromNow))
                    );
                })
                .count();
        
        // Generate sample recent activities
        List<NationalStatisticsResponse.RecentActivity> recentActivities = new ArrayList<>();
        recentActivities.add(NationalStatisticsResponse.RecentActivity.builder()
                .id(1L)
                .type("vaccination")
                .description("Mass vaccination campaign completed at FAC001")
                .timestamp(now.atStartOfDay())
                .facilityId("FAC001")
                .facilityName("Primary Health Center")
                .build());
        
        return NationalStatisticsResponse.builder()
                .totalFacilities(totalFacilities)
                .totalVaccineTypes(totalVaccineTypes)
                .totalDosesAvailable(totalDosesAvailable)
                .totalPatientsRegistered(totalPatientsRegistered.intValue())
                .totalVaccinationsAdministered(totalVaccinationsAdministered.intValue())
                .activeCampaigns(activeCampaigns)
                .lowStockAlerts(lowStockAlerts)
                .expiringBatches(expiringBatches)
                .coverageRate(Math.round(coverageRate * 10.0) / 10.0)
                .facilitiesWithAlerts(facilitiesWithAlerts)
                .recentActivities(recentActivities)
                .build();
    }
}
