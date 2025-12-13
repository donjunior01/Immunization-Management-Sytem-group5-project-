import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface CoverageKPI {
  totalCoverageRate: number;
  fullyVaccinated: number;
  partiallyVaccinated: number;
  unvaccinated: number;
  dropoutRate: number;
  onTimeRate: number;
}

interface VaccineCoverage {
  vaccineName: string;
  targetPopulation: number;
  vaccinated: number;
  coverageRate: number;
  targetRate: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

interface AgeGroupCoverage {
  ageGroup: string;
  ageRange: string;
  targetPopulation: number;
  vaccinated: number;
  fullyVaccinated: number;
  partiallyVaccinated: number;
  coverageRate: number;
}

interface CoverageTrend {
  month: string;
  coverageRate: number;
  fullyVaccinated: number;
  partiallyVaccinated: number;
}

interface GeographicalCoverage {
  district: string;
  facilities: number;
  targetPopulation: number;
  vaccinated: number;
  coverageRate: number;
  status: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface DemographicData {
  category: string;
  male: number;
  female: number;
  total: number;
  malePercentage: number;
  femalePercentage: number;
}

interface DefaulterData {
  vaccine: string;
  duePatients: number;
  missedDoses: number;
  defaulterRate: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
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
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './coverage-report.component.html',
  styleUrls: ['./coverage-report.component.scss']
})
export class CoverageReportComponent implements OnInit {
  kpis: CoverageKPI = {
    totalCoverageRate: 0,
    fullyVaccinated: 0,
    partiallyVaccinated: 0,
    unvaccinated: 0,
    dropoutRate: 0,
    onTimeRate: 0
  };

  vaccineCoverageData: VaccineCoverage[] = [];
  ageGroupData: AgeGroupCoverage[] = [];
  coverageTrends: CoverageTrend[] = [];
  geographicalData: GeographicalCoverage[] = [];
  demographicData: DemographicData[] = [];
  defaulterData: DefaulterData[] = [];

  // Filters
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedDistrict: string = '';
  selectedVaccine: string = '';

  districtOptions = [
    { value: '', label: 'All Districts' },
    { value: 'DIST001', label: 'District 001' },
    { value: 'DIST002', label: 'District 002' },
    { value: 'DIST003', label: 'District 003' }
  ];

  vaccineOptions = [
    { value: '', label: 'All Vaccines' },
    { value: 'BCG', label: 'BCG' },
    { value: 'OPV', label: 'OPV' },
    { value: 'DTP', label: 'DTP' },
    { value: 'Measles', label: 'Measles' },
    { value: 'Hepatitis B', label: 'Hepatitis B' },
    { value: 'Polio', label: 'Polio' }
  ];

  geoDisplayedColumns: string[] = ['district', 'facilities', 'target', 'vaccinated', 'coverage', 'status'];
  defaulterDisplayedColumns: string[] = ['vaccine', 'due', 'missed', 'rate', 'priority', 'actions'];

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCoverageData();
  }

  loadCoverageData(): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      this.loadKPIs();
      this.loadVaccineCoverage();
      this.loadAgeGroupData();
      this.loadCoverageTrends();
      this.loadGeographicalData();
      this.loadDemographicData();
      this.loadDefaulterData();
    }, 1000);
  }

  loadKPIs(): void {
    this.kpis = {
      totalCoverageRate: 87.5,
      fullyVaccinated: 1245,
      partiallyVaccinated: 387,
      unvaccinated: 168,
      dropoutRate: 8.2,
      onTimeRate: 92.3
    };
  }

  loadVaccineCoverage(): void {
    this.vaccineCoverageData = [
      { vaccineName: 'BCG', targetPopulation: 1500, vaccinated: 1425, coverageRate: 95.0, targetRate: 95.0, status: 'EXCELLENT' },
      { vaccineName: 'OPV', targetPopulation: 1500, vaccinated: 1380, coverageRate: 92.0, targetRate: 90.0, status: 'EXCELLENT' },
      { vaccineName: 'DTP', targetPopulation: 1400, vaccinated: 1218, coverageRate: 87.0, targetRate: 90.0, status: 'GOOD' },
      { vaccineName: 'Measles', targetPopulation: 1300, vaccinated: 1066, coverageRate: 82.0, targetRate: 85.0, status: 'GOOD' },
      { vaccineName: 'Hepatitis B', targetPopulation: 1500, vaccinated: 1275, coverageRate: 85.0, targetRate: 90.0, status: 'GOOD' },
      { vaccineName: 'Polio', targetPopulation: 1400, vaccinated: 1092, coverageRate: 78.0, targetRate: 90.0, status: 'FAIR' }
    ];
  }

  loadAgeGroupData(): void {
    this.ageGroupData = [
      { ageGroup: '0-2 months', ageRange: 'Birth to 2 months', targetPopulation: 350, vaccinated: 332, fullyVaccinated: 315, partiallyVaccinated: 17, coverageRate: 94.9 },
      { ageGroup: '3-5 months', ageRange: '3 to 5 months', targetPopulation: 340, vaccinated: 306, fullyVaccinated: 289, partiallyVaccinated: 17, coverageRate: 90.0 },
      { ageGroup: '6-11 months', ageRange: '6 to 11 months', targetPopulation: 330, vaccinated: 284, fullyVaccinated: 251, partiallyVaccinated: 33, coverageRate: 86.1 },
      { ageGroup: '12-23 months', ageRange: '12 to 23 months', targetPopulation: 300, vaccinated: 258, fullyVaccinated: 228, partiallyVaccinated: 30, coverageRate: 86.0 },
      { ageGroup: '24+ months', ageRange: '24 months and older', targetPopulation: 280, vaccinated: 252, fullyVaccinated: 226, partiallyVaccinated: 26, coverageRate: 90.0 }
    ];
  }

  loadCoverageTrends(): void {
    const months = ['Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'];
    const coverageRates = [82.5, 84.2, 85.8, 86.5, 87.0, 87.5];
    const fullyVaccinated = [1050, 1098, 1145, 1180, 1215, 1245];
    const partiallyVaccinated = [420, 408, 395, 390, 388, 387];
    this.coverageTrends = months.map((month, index) => ({
      month,
      coverageRate: coverageRates[index],
      fullyVaccinated: fullyVaccinated[index],
      partiallyVaccinated: partiallyVaccinated[index]
    }));
  }

  loadGeographicalData(): void {
    this.geographicalData = [
      { district: 'District 001', facilities: 5, targetPopulation: 800, vaccinated: 736, coverageRate: 92.0, status: 'HIGH' },
      { district: 'District 002', facilities: 4, targetPopulation: 600, vaccinated: 510, coverageRate: 85.0, status: 'MEDIUM' },
      { district: 'District 003', facilities: 3, targetPopulation: 400, vaccinated: 316, coverageRate: 79.0, status: 'MEDIUM' },
      { district: 'District 004', facilities: 2, targetPopulation: 300, vaccinated: 198, coverageRate: 66.0, status: 'LOW' }
    ];
  }

  loadDemographicData(): void {
    this.demographicData = [
      { category: 'Fully Vaccinated', male: 642, female: 603, total: 1245, malePercentage: 51.6, femalePercentage: 48.4 },
      { category: 'Partially Vaccinated', male: 195, female: 192, total: 387, malePercentage: 50.4, femalePercentage: 49.6 },
      { category: 'Unvaccinated', male: 84, female: 84, total: 168, malePercentage: 50.0, femalePercentage: 50.0 }
    ];
  }

  loadDefaulterData(): void {
    this.defaulterData = [
      { vaccine: 'DTP', duePatients: 85, missedDoses: 127, defaulterRate: 9.1, priority: 'HIGH' },
      { vaccine: 'Measles', duePatients: 72, missedDoses: 108, defaulterRate: 8.3, priority: 'HIGH' },
      { vaccine: 'Polio', duePatients: 68, missedDoses: 102, defaulterRate: 7.8, priority: 'MEDIUM' },
      { vaccine: 'Hepatitis B', duePatients: 54, missedDoses: 81, defaulterRate: 6.2, priority: 'MEDIUM' },
      { vaccine: 'OPV', duePatients: 38, missedDoses: 57, defaulterRate: 4.1, priority: 'LOW' },
      { vaccine: 'BCG', duePatients: 25, missedDoses: 38, defaulterRate: 2.7, priority: 'LOW' }
    ];
  }

  applyFilters(): void {
    this.loaderService.show(800);
    setTimeout(() => {
      this.notificationService.success('Filters applied successfully');
    }, 800);
  }

  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedDistrict = '';
    this.selectedVaccine = '';
    this.applyFilters();
  }

  getVaccineStatusClass(status: string): string {
    return { 'EXCELLENT': 'status-excellent', 'GOOD': 'status-good', 'FAIR': 'status-fair', 'POOR': 'status-poor' }[status] || '';
  }

  getGeoStatusClass(status: string): string {
    return { 'HIGH': 'status-high', 'MEDIUM': 'status-medium', 'LOW': 'status-low' }[status] || '';
  }

  getPriorityClass(priority: string): string {
    return { 'HIGH': 'priority-high', 'MEDIUM': 'priority-medium', 'LOW': 'priority-low' }[priority] || '';
  }

  getCoverageColor(rate: number): string {
    if (rate >= 90) return '#27ae60';
    if (rate >= 80) return '#3498db';
    if (rate >= 70) return '#f39c12';
    return '#e74c3c';
  }

  contactDefaulters(vaccine: string): void {
    this.loaderService.show(800);
    setTimeout(() => {
      this.notificationService.success(`Defaulter contact initiated for ${vaccine}`);
    }, 800);
  }

  exportReport(format: string): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      if (format === 'csv') this.generateCSV();
      else if (format === 'pdf') this.generatePDF();
    }, 1000);
  }

  generateCSV(): void {
    let csv = 'Vaccination Coverage Report\n\n';
    csv += 'KEY PERFORMANCE INDICATORS\nMetric,Value\n';
    csv += `Total Coverage Rate,${this.kpis.totalCoverageRate}%\nFully Vaccinated,${this.kpis.fullyVaccinated}\n`;
    csv += `Partially Vaccinated,${this.kpis.partiallyVaccinated}\nUnvaccinated,${this.kpis.unvaccinated}\n`;
    csv += `Dropout Rate,${this.kpis.dropoutRate}%\nOn-Time Rate,${this.kpis.onTimeRate}%\n\n`;
    csv += 'VACCINE COVERAGE\nVaccine,Target,Vaccinated,Coverage Rate,Target Rate,Status\n';
    this.vaccineCoverageData.forEach(v => csv += `${v.vaccineName},${v.targetPopulation},${v.vaccinated},${v.coverageRate}%,${v.targetRate}%,${v.status}\n`);
    csv += '\nCOVERAGE BY AGE GROUP\nAge Group,Target,Vaccinated,Fully Vaccinated,Partially Vaccinated,Coverage Rate\n';
    this.ageGroupData.forEach(a => csv += `${a.ageGroup},${a.targetPopulation},${a.vaccinated},${a.fullyVaccinated},${a.partiallyVaccinated},${a.coverageRate}%\n`);
    csv += '\nGEOGRAPHICAL COVERAGE\nDistrict,Facilities,Target,Vaccinated,Coverage Rate,Status\n';
    this.geographicalData.forEach(g => csv += `${g.district},${g.facilities},${g.targetPopulation},${g.vaccinated},${g.coverageRate}%,${g.status}\n`);
    csv += '\nDEMOGRAPHIC BREAKDOWN\nCategory,Male,Female,Total,Male %,Female %\n';
    this.demographicData.forEach(d => csv += `${d.category},${d.male},${d.female},${d.total},${d.malePercentage}%,${d.femalePercentage}%\n`);
    csv += '\nDEFAULTERS DATA\nVaccine,Due Patients,Missed Doses,Defaulter Rate,Priority\n';
    this.defaulterData.forEach(d => csv += `${d.vaccine},${d.duePatients},${d.missedDoses},${d.defaulterRate}%,${d.priority}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coverage-report-${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    this.notificationService.success('CSV report downloaded successfully');
  }

  generatePDF(): void {
    this.notificationService.info('PDF generation would require additional library (e.g., jsPDF)');
  }

  refreshReport(): void {
    this.loadCoverageData();
    this.notificationService.success('Report refreshed successfully');
  }
}
