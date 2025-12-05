package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoverageReportResponse {
    private SummaryStats summaryStats;
    private List<VaccineData> vaccineData;
    private List<TrendData> trendData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        private Double nationalCoverage;
        private Double districtCoverage;
        private Double facilityCoverage;
        private Double targetVsAchieved;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaccineData {
        private String vaccine;
        private Integer target;
        private Integer achieved;
        private Double coverage;
        private String trend;
        private List<AgeGroupData> children;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgeGroupData {
        private String ageGroup;
        private Integer target;
        private Integer achieved;
        private Double coverage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        private String month;
        private Double coverage;
    }
}
