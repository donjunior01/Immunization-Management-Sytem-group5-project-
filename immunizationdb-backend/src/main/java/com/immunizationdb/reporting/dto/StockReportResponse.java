package com.immunizationdb.reporting.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReportResponse {
    private SummaryStats summaryStats;
    private List<StockItem> stockItems;
    private List<StockAlert> alerts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        private Integer totalVaccines;
        private Integer lowStock;
        private Integer expiringSoon;
        private Integer expired;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockItem {
        private String vaccine;
        private String batchNumber;
        private Integer quantity;
        private LocalDate expiryDate;
        private String status;
        private Integer daysUntilExpiry;
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockAlert {
        private String type;
        private String vaccine;
        private String message;
        private String severity;
    }
}
