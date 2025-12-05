package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityComparisonResponse {
    private List<FacilityData> facilities;
    private List<ComparisonMetric> comparisonMetrics;
    private List<BestPractice> bestPractices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FacilityData {
        private Long id;
        private String name;
        private String district;
        private Integer totalVaccinations;
        private Double coverageRate;
        private String stockStatus;
        private Integer staffCount;
        private LocalDateTime lastUpdated;
        private Integer rank;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonMetric {
        private String metric;
        private Map<String, String> facilityValues;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BestPractice {
        private String facility;
        private String practice;
        private String impact;
    }
}
