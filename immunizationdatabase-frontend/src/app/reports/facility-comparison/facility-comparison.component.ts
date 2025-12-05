import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

interface FacilityData {
  name: string;
  district: string;
  vaccinationsPerformed: number;
  coverageRate: number;
  stockLevels: string;
  activeStaff: number;
  performance: number;
  rank: number;
}

interface PerformanceMetric {
  metric: string;
  facility1: number;
  facility2: number;
  facility3: number;
  average: number;
}

@Component({
  selector: 'app-facility-comparison',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './facility-comparison.component.html',
  styleUrls: ['./facility-comparison.component.scss']
})
export class FacilityComparisonComponent implements OnInit {
  isLoading = false;
  selectedDistrict = 'all';
  selectedPeriod = 'current-month';

  displayedColumns: string[] = ['rank', 'facility', 'district', 'vaccinations', 'coverage', 'stock', 'staff', 'performance'];
  comparisonColumns: string[] = ['metric', 'facility1', 'facility2', 'facility3', 'average'];

  // Facility performance data
  facilitiesData: FacilityData[] = [
    {
      name: 'Central Health Center',
      district: 'Central',
      vaccinationsPerformed: 2450,
      coverageRate: 92,
      stockLevels: 'Adequate',
      activeStaff: 12,
      performance: 95,
      rank: 1
    },
    {
      name: 'North District Clinic',
      district: 'North',
      vaccinationsPerformed: 2180,
      coverageRate: 88,
      stockLevels: 'Adequate',
      activeStaff: 10,
      performance: 91,
      rank: 2
    },
    {
      name: 'East Medical Center',
      district: 'East',
      vaccinationsPerformed: 1950,
      coverageRate: 85,
      stockLevels: 'Low',
      activeStaff: 9,
      performance: 87,
      rank: 3
    },
    {
      name: 'South Community Clinic',
      district: 'South',
      vaccinationsPerformed: 1720,
      coverageRate: 82,
      stockLevels: 'Adequate',
      activeStaff: 8,
      performance: 84,
      rank: 4
    },
    {
      name: 'West Health Post',
      district: 'West',
      vaccinationsPerformed: 1580,
      coverageRate: 78,
      stockLevels: 'Low',
      activeStaff: 7,
      performance: 80,
      rank: 5
    },
    {
      name: 'Rural Health Unit A',
      district: 'North',
      vaccinationsPerformed: 1420,
      coverageRate: 75,
      stockLevels: 'Critical',
      activeStaff: 6,
      performance: 76,
      rank: 6
    },
    {
      name: 'Suburban Clinic B',
      district: 'East',
      vaccinationsPerformed: 1290,
      coverageRate: 72,
      stockLevels: 'Low',
      activeStaff: 5,
      performance: 73,
      rank: 7
    },
    {
      name: 'District Hospital C',
      district: 'South',
      vaccinationsPerformed: 1150,
      coverageRate: 68,
      stockLevels: 'Adequate',
      activeStaff: 8,
      performance: 70,
      rank: 8
    }
  ];

  // Top 3 facilities comparison metrics
  comparisonData: PerformanceMetric[] = [
    {
      metric: 'Vaccinations Performed',
      facility1: 2450,
      facility2: 2180,
      facility3: 1950,
      average: 2193
    },
    {
      metric: 'Coverage Rate (%)',
      facility1: 92,
      facility2: 88,
      facility3: 85,
      average: 88
    },
    {
      metric: 'Active Staff',
      facility1: 12,
      facility2: 10,
      facility3: 9,
      average: 10
    },
    {
      metric: 'Stock Adequacy (%)',
      facility1: 95,
      facility2: 92,
      facility3: 78,
      average: 88
    },
    {
      metric: 'Performance Score',
      facility1: 95,
      facility2: 91,
      facility3: 87,
      average: 91
    }
  ];

  // District summary
  districtSummary = [
    { district: 'Central', facilities: 3, totalVaccinations: 5680, averageCoverage: 87 },
    { district: 'North', facilities: 4, totalVaccinations: 5420, averageCoverage: 84 },
    { district: 'East', facilities: 3, totalVaccinations: 4190, averageCoverage: 80 },
    { district: 'South', facilities: 2, totalVaccinations: 2870, averageCoverage: 75 },
    { district: 'West', facilities: 2, totalVaccinations: 2310, averageCoverage: 72 }
  ];

  topFacilities: FacilityData[] = [];

  constructor() {}

  ngOnInit(): void {
    this.loadComparisonData();
  }

  loadComparisonData(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.topFacilities = this.facilitiesData.slice(0, 3);
      this.isLoading = false;
    }, 1000);
  }

  onDistrictChange(): void {
    this.loadComparisonData();
  }

  onPeriodChange(): void {
    this.loadComparisonData();
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 90) return 'success';
    if (coverage >= 80) return 'primary';
    if (coverage >= 70) return 'accent';
    return 'warn';
  }

  getStockColor(stock: string): string {
    switch (stock.toLowerCase()) {
      case 'adequate': return 'success';
      case 'low': return 'accent';
      case 'critical': return 'warn';
      default: return '';
    }
  }

  getPerformanceColor(performance: number): string {
    if (performance >= 90) return 'success';
    if (performance >= 80) return 'primary';
    if (performance >= 70) return 'accent';
    return 'warn';
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return 'emoji_events';
      case 2: return 'workspace_premium';
      case 3: return 'military_tech';
      default: return 'flag';
    }
  }

  getRankColor(rank: number): string {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#757575';
    }
  }

  getBestPerformer(facility1: number, facility2: number, facility3: number): number {
    return Math.max(facility1, facility2, facility3);
  }

  isBestPerformer(value: number, facility1: number, facility2: number, facility3: number): boolean {
    return value === this.getBestPerformer(facility1, facility2, facility3);
  }

  exportReport(): void {
    const headers = ['Rank', 'Facility', 'District', 'Vaccinations', 'Coverage %', 'Stock', 'Staff', 'Performance'];
    const rows = this.facilitiesData.map(f => [
      f.rank,
      f.name,
      f.district,
      f.vaccinationsPerformed,
      f.coverageRate,
      f.stockLevels,
      f.activeStaff,
      f.performance
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facility-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
