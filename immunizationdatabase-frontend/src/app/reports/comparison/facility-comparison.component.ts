import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

// Interfaces
interface ComparisonKPI {
  averageCoverage: number;
  averageStockLevel: number;
  averageWastage: number;
  totalFacilities: number;
}

interface FacilityMetric {
  facilityId: string;
  facilityName: string;
  district: string;
  coverageRate: number;
  stockLevel: number;
  wastageRate: number;
  efficiency: number;
  rank: number;
  trend: string;
  performanceScore: number;
}

interface PerformanceCategory {
  category: string;
  description: string;
  topFacility: string;
  topScore: number;
  averageScore: number;
  facilities: number;
}

interface BestPractice {
  facilityName: string;
  category: string;
  practice: string;
  impact: string;
  metrics: string;
  status: string;
}

interface DistrictComparison {
  district: string;
  facilities: number;
  averageCoverage: number;
  totalVaccinations: number;
  stockEfficiency: number;
  rank: number;
}

interface MetricComparison {
  metric: string;
  national: number;
  district: number;
  facility: number;
  variance: number;
  status: string;
}

interface TrendData {
  month: string;
  fac001: number;
  fac002: number;
  fac003: number;
  fac004: number;
  national: number;
}

@Component({
  selector: 'app-facility-comparison',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './facility-comparison.component.html',
  styleUrl: './facility-comparison.component.scss'
})
export class FacilityComparisonComponent implements OnInit {
  // KPIs
  kpis: ComparisonKPI = {
    averageCoverage: 0,
    averageStockLevel: 0,
    averageWastage: 0,
    totalFacilities: 0
  };

  // Data arrays
  facilityMetrics: FacilityMetric[] = [];
  performanceCategories: PerformanceCategory[] = [];
  bestPractices: BestPractice[] = [];
  districtComparison: DistrictComparison[] = [];
  metricComparison: MetricComparison[] = [];
  trendData: TrendData[] = [];

  // Filters
  selectedDistrict: string = '';
  selectedMetric: string = 'coverage';
  selectedPeriod: string = 'last-6-months';

  // Options
  districtOptions: string[] = ['All Districts', 'DIST001', 'DIST002', 'DIST003', 'DIST004'];
  metricOptions = [
    { value: 'coverage', label: 'Coverage Rate' },
    { value: 'stock', label: 'Stock Level' },
    { value: 'wastage', label: 'Wastage Rate' },
    { value: 'efficiency', label: 'Efficiency Score' }
  ];
  periodOptions = [
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' }
  ];

  // Table columns
  facilityDisplayedColumns: string[] = ['rank', 'facility', 'district', 'coverage', 'stock', 'wastage', 'efficiency', 'trend', 'score'];
  categoryDisplayedColumns: string[] = ['category', 'description', 'topFacility', 'topScore', 'averageScore', 'facilities'];
  practiceDisplayedColumns: string[] = ['facility', 'category', 'practice', 'impact', 'metrics', 'status'];
  districtDisplayedColumns: string[] = ['rank', 'district', 'facilities', 'coverage', 'vaccinations', 'efficiency'];
  metricDisplayedColumns: string[] = ['metric', 'national', 'district', 'facility', 'variance', 'status'];

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadComparisonData();
  }

  loadComparisonData(): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      this.loadKPIs();
      this.loadFacilityMetrics();
      this.loadPerformanceCategories();
      this.loadBestPractices();
      this.loadDistrictComparison();
      this.loadMetricComparison();
      this.loadTrendData();
    }, 1000);
  }

  loadKPIs(): void {
    this.kpis = {
      averageCoverage: 84.3,
      averageStockLevel: 78.5,
      averageWastage: 4.2,
      totalFacilities: 14
    };
  }

  loadFacilityMetrics(): void {
    this.facilityMetrics = [
      { facilityId: 'FAC001', facilityName: 'Central Health Center', district: 'DIST001', coverageRate: 92.5, stockLevel: 88, wastageRate: 2.8, efficiency: 94.2, rank: 1, trend: 'UP', performanceScore: 95.8 },
      { facilityId: 'FAC004', facilityName: 'East District Clinic', district: 'DIST002', coverageRate: 89.3, stockLevel: 85, wastageRate: 3.1, efficiency: 91.5, rank: 2, trend: 'UP', performanceScore: 92.4 },
      { facilityId: 'FAC007', facilityName: 'South Regional Hospital', district: 'DIST003', coverageRate: 87.8, stockLevel: 82, wastageRate: 3.5, efficiency: 89.8, rank: 3, trend: 'STABLE', performanceScore: 90.1 },
      { facilityId: 'FAC002', facilityName: 'North Community Center', district: 'DIST001', coverageRate: 86.5, stockLevel: 80, wastageRate: 3.8, efficiency: 88.2, rank: 4, trend: 'STABLE', performanceScore: 88.6 },
      { facilityId: 'FAC003', facilityName: 'West Medical Facility', district: 'DIST002', coverageRate: 84.2, stockLevel: 76, wastageRate: 4.2, efficiency: 85.7, rank: 5, trend: 'UP', performanceScore: 86.3 },
      { facilityId: 'FAC006', facilityName: 'Suburban Health Post', district: 'DIST003', coverageRate: 82.9, stockLevel: 74, wastageRate: 4.5, efficiency: 83.4, rank: 6, trend: 'DOWN', performanceScore: 84.1 },
      { facilityId: 'FAC005', facilityName: 'Rural Outreach Center', district: 'DIST004', coverageRate: 79.5, stockLevel: 70, wastageRate: 5.1, efficiency: 80.2, rank: 7, trend: 'STABLE', performanceScore: 81.3 },
      { facilityId: 'FAC008', facilityName: 'Remote Health Station', district: 'DIST004', coverageRate: 75.8, stockLevel: 65, wastageRate: 6.2, efficiency: 76.5, rank: 8, trend: 'DOWN', performanceScore: 77.9 }
    ];
  }

  loadPerformanceCategories(): void {
    this.performanceCategories = [
      { category: 'Vaccination Coverage', description: 'Overall immunization coverage rate', topFacility: 'Central Health Center', topScore: 92.5, averageScore: 84.3, facilities: 14 },
      { category: 'Stock Management', description: 'Inventory efficiency and availability', topFacility: 'Central Health Center', topScore: 88.0, averageScore: 78.5, facilities: 14 },
      { category: 'Wastage Control', description: 'Vaccine wastage minimization', topFacility: 'Central Health Center', topScore: 97.2, averageScore: 95.8, facilities: 14 },
      { category: 'Operational Efficiency', description: 'Overall facility performance', topFacility: 'Central Health Center', topScore: 94.2, averageScore: 86.4, facilities: 14 },
      { category: 'Patient Satisfaction', description: 'Service quality and satisfaction', topFacility: 'East District Clinic', topScore: 93.8, averageScore: 87.2, facilities: 14 },
      { category: 'Data Quality', description: 'Reporting accuracy and timeliness', topFacility: 'South Regional Hospital', topScore: 96.5, averageScore: 89.7, facilities: 14 }
    ];
  }

  loadBestPractices(): void {
    this.bestPractices = [
      { facilityName: 'Central Health Center', category: 'Stock Management', practice: 'Real-time inventory tracking system', impact: 'Reduced stockouts by 45%', metrics: 'Stock availability: 98%', status: 'VERIFIED' },
      { facilityName: 'East District Clinic', category: 'Patient Engagement', practice: 'SMS reminder system for appointments', impact: 'Increased attendance by 32%', metrics: 'Show-up rate: 94%', status: 'VERIFIED' },
      { facilityName: 'Central Health Center', category: 'Wastage Reduction', practice: 'Temperature monitoring with alerts', impact: 'Reduced cold chain failures by 67%', metrics: 'Wastage rate: 2.8%', status: 'VERIFIED' },
      { facilityName: 'South Regional Hospital', category: 'Data Management', practice: 'Automated reporting with validation', impact: 'Improved data accuracy by 89%', metrics: 'Error rate: <1%', status: 'VERIFIED' },
      { facilityName: 'East District Clinic', category: 'Community Outreach', practice: 'Mobile vaccination camps', impact: 'Reached 15% more rural population', metrics: 'Coverage increase: 15%', status: 'VERIFIED' },
      { facilityName: 'Central Health Center', category: 'Staff Training', practice: 'Monthly skills enhancement workshops', impact: 'Improved service quality by 28%', metrics: 'Satisfaction: 93%', status: 'PILOT' }
    ];
  }

  loadDistrictComparison(): void {
    this.districtComparison = [
      { district: 'DIST001', facilities: 4, averageCoverage: 89.5, totalVaccinations: 4567, stockEfficiency: 84, rank: 1 },
      { district: 'DIST002', facilities: 3, averageCoverage: 86.8, totalVaccinations: 3892, stockEfficiency: 80.5, rank: 2 },
      { district: 'DIST003', facilities: 4, averageCoverage: 85.4, totalVaccinations: 4123, stockEfficiency: 78.5, rank: 3 },
      { district: 'DIST004', facilities: 3, averageCoverage: 77.7, totalVaccinations: 2654, stockEfficiency: 67.5, rank: 4 }
    ];
  }

  loadMetricComparison(): void {
    this.metricComparison = [
      { metric: 'Coverage Rate', national: 84.3, district: 89.5, facility: 92.5, variance: 8.2, status: 'ABOVE' },
      { metric: 'Stock Availability', national: 78.5, district: 84.0, facility: 88.0, variance: 9.5, status: 'ABOVE' },
      { metric: 'Wastage Rate', national: 4.2, district: 3.2, facility: 2.8, variance: -1.4, status: 'BETTER' },
      { metric: 'Vaccination Rate', national: 763, district: 912, facility: 1043, variance: 280, status: 'ABOVE' },
      { metric: 'Cold Chain Compliance', national: 87.5, district: 91.2, facility: 96.5, variance: 9.0, status: 'ABOVE' },
      { metric: 'Reporting Timeliness', national: 82.3, district: 88.7, facility: 94.2, variance: 11.9, status: 'ABOVE' }
    ];
  }

  loadTrendData(): void {
    this.trendData = [
      { month: 'Jul 2024', fac001: 88, fac002: 82, fac003: 79, fac004: 85, national: 81 },
      { month: 'Aug 2024', fac001: 89, fac002: 83, fac003: 81, fac004: 86, national: 82 },
      { month: 'Sep 2024', fac001: 90, fac002: 84, fac003: 82, fac004: 87, national: 82.5 },
      { month: 'Oct 2024', fac001: 91, fac002: 85, fac003: 83, fac004: 88, national: 83 },
      { month: 'Nov 2024', fac001: 92, fac002: 86, fac003: 84, fac004: 89, national: 84 },
      { month: 'Dec 2024', fac001: 92.5, fac002: 86.5, fac003: 84.2, fac004: 89.3, national: 84.3 }
    ];
  }

  applyFilters(): void {
    this.loaderService.show(800);
    setTimeout(() => {
      this.notificationService.success('Filters applied successfully');
      this.loadComparisonData();
    }, 800);
  }

  resetFilters(): void {
    this.selectedDistrict = '';
    this.selectedMetric = 'coverage';
    this.selectedPeriod = 'last-6-months';
    this.applyFilters();
  }

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'UP': return 'trending_up';
      case 'DOWN': return 'trending_down';
      case 'STABLE': return 'trending_flat';
      default: return 'remove';
    }
  }

  getTrendClass(trend: string): string {
    switch (trend) {
      case 'UP': return 'trend-up';
      case 'DOWN': return 'trend-down';
      case 'STABLE': return 'trend-stable';
      default: return '';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 70) return 'score-fair';
    return 'score-poor';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ABOVE': return 'status-above';
      case 'BETTER': return 'status-better';
      case 'BELOW': return 'status-below';
      default: return '';
    }
  }

  getPracticeStatusClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'practice-verified';
      case 'PILOT': return 'practice-pilot';
      case 'PROPOSED': return 'practice-proposed';
      default: return '';
    }
  }

  getPerformanceColor(score: number): string {
    if (score >= 90) return '#27ae60';
    if (score >= 80) return '#3498db';
    if (score >= 70) return '#f39c12';
    return '#e74c3c';
  }

  exportReport(format: string): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      if (format === 'csv') this.generateCSV();
      else if (format === 'pdf') this.generatePDF();
    }, 1000);
  }

  generateCSV(): void {
    let csv = 'Facility Comparison Report - Immunization Database\n\n';
    
    // KPIs
    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value\n';
    csv += `Average Coverage,${this.kpis.averageCoverage}%\n`;
    csv += `Average Stock Level,${this.kpis.averageStockLevel}%\n`;
    csv += `Average Wastage,${this.kpis.averageWastage}%\n`;
    csv += `Total Facilities,${this.kpis.totalFacilities}\n\n`;

    // Facility Metrics
    csv += 'FACILITY PERFORMANCE METRICS\n';
    csv += 'Rank,Facility,District,Coverage,Stock,Wastage,Efficiency,Trend,Score\n';
    this.facilityMetrics.forEach(f => {
      csv += `${f.rank},${f.facilityName},${f.district},${f.coverageRate}%,${f.stockLevel}%,${f.wastageRate}%,${f.efficiency}%,${f.trend},${f.performanceScore}\n`;
    });
    csv += '\n';

    // Best Practices
    csv += 'BEST PRACTICES\n';
    csv += 'Facility,Category,Practice,Impact,Metrics,Status\n';
    this.bestPractices.forEach(p => {
      csv += `${p.facilityName},${p.category},${p.practice},${p.impact},${p.metrics},${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facility-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.notificationService.success('CSV report downloaded successfully');
  }

  generatePDF(): void {
    this.notificationService.info('PDF generation would require additional library (e.g., jsPDF)');
  }

  refreshReport(): void {
    this.loadComparisonData();
    this.notificationService.success('Report refreshed successfully');
  }

  viewFacilityDetails(facilityId: string): void {
    this.notificationService.info(`Viewing details for ${facilityId}`);
  }

  adoptBestPractice(practice: BestPractice): void {
    this.notificationService.success(`Best practice "${practice.practice}" marked for adoption`);
  }
}
