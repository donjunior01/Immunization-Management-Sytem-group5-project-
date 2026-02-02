import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { ReportService } from '../../../../core/services/report.service';
import { FacilityService } from '../../../../core/services/facility.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Chart, ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

interface CoverageReport {
  totalPatientsRegistered: number;
  vaccinationsByVaccineType: Array<{ vaccineName: string; count: number }>;
  penta1Penta3DropoutRate: number;
  coveragePercentage: number;
  targetPopulation: number;
  vaccinatedCount: number;
}

@Component({
  selector: 'app-district-coverage-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LayoutComponent, LoaderComponent, AlertComponent, BaseChartDirective],
  templateUrl: './district-coverage-report.component.html',
  styleUrl: './district-coverage-report.component.scss'
})
export class DistrictCoverageReportComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  reportForm: FormGroup;
  loading = false;
  errorMessage = '';
  reportData: CoverageReport | null = null;
  
  // Chart data
  public barChartType: ChartType = 'bar';
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Vaccinations by Vaccine Type'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{
      label: 'Vaccinations',
      data: [],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };

  facilities: Array<{ id: string; name: string }> = [];
  selectedFacilityId: string = '';

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private facilityService: FacilityService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.reportForm = this.fb.group({
      facilityId: [''],
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
      endDate: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadFacilities();
    const user = this.authService.getCurrentUser();
    if (user?.facilityId) {
      this.reportForm.patchValue({ facilityId: user.facilityId });
      this.selectedFacilityId = user.facilityId;
    }
  }

  loadFacilities(): void {
    // District dashboard plays admin role - load ALL facilities
const user = this.authService.getCurrentUser();
    
    this.facilityService.getAllFacilities(true).subscribe({
      next: (facilities) => {
this.facilities = facilities.map(f => ({ id: f.id, name: f.name || f.id }));
        if (user?.facilityId && this.facilities.length > 0) {
          // Pre-select user's facility if available
          if (this.facilities.find(f => f.id === user.facilityId)) {
            this.reportForm.patchValue({ facilityId: user.facilityId });
            this.selectedFacilityId = user.facilityId;
          }
        }
      },
      error: (error) => {
console.error('Error loading all facilities:', error);
        this.facilities = [];
      }
    });
  }

  onFacilityChange(): void {
    this.selectedFacilityId = this.reportForm.get('facilityId')?.value || '';
  }

  loadReport(): void {
    const formValue = this.reportForm.value;
    if (!formValue.facilityId) {
      this.errorMessage = 'Please select a facility';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.reportData = null;

    this.reportService.getCoverageReport(
      formValue.facilityId,
      formValue.startDate,
      formValue.endDate
    ).subscribe({
      next: (data) => {
        this.reportData = data;
        this.updateChart(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading coverage report:', error);
        this.errorMessage = error?.error?.message || 'Failed to load coverage report';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateChart(data: CoverageReport): void {
    if (data.vaccinationsByVaccineType && data.vaccinationsByVaccineType.length > 0) {
      this.barChartData = {
        labels: data.vaccinationsByVaccineType.map(v => v.vaccineName),
        datasets: [{
          label: 'Vaccinations',
          data: data.vaccinationsByVaccineType.map(v => v.count),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      };
      // Use setTimeout to ensure chart view is ready
      setTimeout(() => {
        this.chart?.update();
        this.cdr.detectChanges();
      }, 0);
    } else {
      // Reset chart data if no data available
      this.barChartData = {
        labels: [],
        datasets: [{
          label: 'Vaccinations',
          data: [],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      };
      setTimeout(() => {
        this.chart?.update();
        this.cdr.detectChanges();
      }, 0);
    }
  }

  exportToExcel(): void {
    if (!this.reportData) {
      this.errorMessage = 'No data to export. Please load a report first.';
      return;
    }

    const formValue = this.reportForm.value;
    this.reportService.exportData(
      formValue.facilityId,
      formValue.startDate,
      formValue.endDate
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Backend returns CSV, so use .csv extension
        a.download = `coverage-report-${formValue.startDate}-${formValue.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.errorMessage = 'Failed to export report. Please try again.';
      }
    });
  }
}
