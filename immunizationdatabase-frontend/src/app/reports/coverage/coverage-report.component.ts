import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface CoverageData {
  vaccine: string;
  targetPopulation: number;
  vaccinated: number;
  coverage: number;
  trend: 'up' | 'down' | 'stable';
}

interface RegionalCoverage {
  region: string;
  coverage: number;
  vaccinated: number;
  target: number;
}

@Component({
  selector: 'app-coverage-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FormsModule
  ],
  templateUrl: './coverage-report.component.html',
  styleUrls: ['./coverage-report.component.scss']
})
export class CoverageReportComponent implements OnInit {
  isLoading = false;
  selectedPeriod = 'current-year';
  selectedRegion = 'all';
  
  displayedColumns: string[] = ['vaccine', 'target', 'vaccinated', 'coverage', 'trend'];
  regionalColumns: string[] = ['region', 'coverage', 'vaccinated', 'target'];

  // Overall statistics
  overallCoverage = 78.5;
  totalVaccinated = 156789;
  totalTarget = 200000;
  coverageChange = 5.2;

  // Vaccine-specific coverage data
  coverageData: CoverageData[] = [
    { vaccine: 'BCG', targetPopulation: 25000, vaccinated: 22500, coverage: 90, trend: 'up' },
    { vaccine: 'Polio', targetPopulation: 24000, vaccinated: 21600, coverage: 90, trend: 'up' },
    { vaccine: 'DTP', targetPopulation: 22000, vaccinated: 19360, coverage: 88, trend: 'stable' },
    { vaccine: 'Hepatitis B', targetPopulation: 23000, vaccinated: 20240, coverage: 88, trend: 'up' },
    { vaccine: 'Measles', targetPopulation: 21000, vaccinated: 18060, coverage: 86, trend: 'up' },
    { vaccine: 'Rotavirus', targetPopulation: 20000, vaccinated: 16000, coverage: 80, trend: 'stable' },
    { vaccine: 'Pneumococcal', targetPopulation: 19000, vaccinated: 14440, coverage: 76, trend: 'down' },
    { vaccine: 'HPV', targetPopulation: 18000, vaccinated: 12600, coverage: 70, trend: 'up' },
    { vaccine: 'Influenza', targetPopulation: 15000, vaccinated: 9750, coverage: 65, trend: 'stable' },
    { vaccine: 'COVID-19', targetPopulation: 13000, vaccinated: 7800, coverage: 60, trend: 'up' }
  ];

  // Regional coverage data
  regionalData: RegionalCoverage[] = [
    { region: 'North District', coverage: 85, vaccinated: 42500, target: 50000 },
    { region: 'South District', coverage: 82, vaccinated: 32800, target: 40000 },
    { region: 'East District', coverage: 78, vaccinated: 31200, target: 40000 },
    { region: 'West District', coverage: 75, vaccinated: 26250, target: 35000 },
    { region: 'Central District', coverage: 72, vaccinated: 25200, target: 35000 }
  ];

  // Age group coverage
  ageGroupData = [
    { group: 'Birth - 6 weeks', coverage: 92 },
    { group: '6 weeks - 2 months', coverage: 90 },
    { group: '2 - 4 months', coverage: 88 },
    { group: '4 - 6 months', coverage: 85 },
    { group: '6 - 12 months', coverage: 82 },
    { group: '12 - 18 months', coverage: 78 },
    { group: '18 months - 5 years', coverage: 75 },
    { group: '5 - 12 years', coverage: 70 },
    { group: '12 - 18 years', coverage: 65 }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadCoverageData();
  }

  loadCoverageData(): void {
    this.isLoading = true;
    // Simulate API call
    setTimeout(() => {
      // Data already loaded from mock
      this.isLoading = false;
    }, 1000);
  }

  onPeriodChange(): void {
    this.loadCoverageData();
  }

  onRegionChange(): void {
    this.loadCoverageData();
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 90) return 'success';
    if (coverage >= 80) return 'primary';
    if (coverage >= 70) return 'accent';
    return 'warn';
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendColor(trend: string): string {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'warn';
      default: return 'neutral';
    }
  }

  exportReport(): void {
    // Generate CSV
    const headers = ['Vaccine', 'Target Population', 'Vaccinated', 'Coverage %', 'Trend'];
    const rows = this.coverageData.map(d => [
      d.vaccine,
      d.targetPopulation,
      d.vaccinated,
      d.coverage,
      d.trend
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  generatePDF(): void {
    // This would integrate with a PDF generation library
    alert('PDF generation feature coming soon!');
  }
}
