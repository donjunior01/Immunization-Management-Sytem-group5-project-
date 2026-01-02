import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { PatientService } from '../../../core/services/patient.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { StockService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-reports.component.html',
  styleUrl: './manager-reports.component.scss'
})
export class ManagerReportsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  reportType = 'coverage';
  dateRangeForm: FormGroup;
  
  // Report Data
  coverageData: any = null;
  vaccinationStats: any = null;
  stockReport: any = null;
  
  // Date ranges
  startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  
  private isLoadingData = false;

  constructor(
    private patientService: PatientService,
    private vaccinationService: VaccinationService,
    private stockService: StockService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.dateRangeForm = this.fb.group({
      startDate: [this.startDate],
      endDate: [this.endDate]
    });
  }

  ngOnInit(): void {
    this.loadReport();
  }

  onReportTypeChange(): void {
    this.loadReport();
  }

  onDateRangeChange(): void {
    this.startDate = this.dateRangeForm.value.startDate;
    this.endDate = this.dateRangeForm.value.endDate;
    this.loadReport();
  }

  loadReport(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (!facilityId) {
      this.errorMessage = 'No facility ID available';
      this.loading = false;
      this.isLoadingData = false;
      return;
    }

    switch (this.reportType) {
      case 'coverage':
        this.loadCoverageReport(facilityId, startTime);
        break;
      case 'vaccinations':
        this.loadVaccinationStats(facilityId, startTime);
        break;
      case 'stock':
        this.loadStockReport(facilityId, startTime);
        break;
      default:
        this.loading = false;
        this.isLoadingData = false;
    }
  }

  private loadCoverageReport(facilityId: string, startTime: number): void {
    // Load patients and vaccinations for coverage calculation
    this.patientService.getPatientsByFacility(facilityId).subscribe({
      next: (patients) => {
        this.vaccinationService.getVaccinationsByDateRange(facilityId, this.startDate, this.endDate).subscribe({
          next: (vaccinations) => {
            // Calculate coverage
            const totalPatients = patients.length;
            const vaccinatedPatients = new Set(vaccinations.map(v => v.patientId)).size;
            const coverageRate = totalPatients > 0 ? (vaccinatedPatients / totalPatients) * 100 : 0;
            
            // Group by vaccine
            const byVaccine = vaccinations.reduce((acc: any, v: any) => {
              const vaccineName = v.vaccineName || 'Unknown';
              if (!acc[vaccineName]) {
                acc[vaccineName] = { count: 0, doses: [] };
              }
              acc[vaccineName].count++;
              acc[vaccineName].doses.push(v.doseNumber || 1);
              return acc;
            }, {});

            this.coverageData = {
              totalPatients,
              vaccinatedPatients,
              coverageRate: Math.round(coverageRate * 10) / 10,
              byVaccine: Object.entries(byVaccine).map(([name, data]: [string, any]) => ({
                name,
                count: data.count,
                doses: data.doses
              }))
            };

            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
              this.isLoadingData = false;
              this.cdr.detectChanges();
            });
          },
          error: (error) => {
            console.warn('Failed to load vaccinations:', error);
            this.errorMessage = 'Failed to load vaccination data';
            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
              this.isLoadingData = false;
              this.cdr.detectChanges();
            });
          }
        });
      },
      error: (error) => {
        console.warn('Failed to load patients:', error);
        this.errorMessage = 'Failed to load patient data';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadVaccinationStats(facilityId: string, startTime: number): void {
    this.vaccinationService.getVaccinationsByDateRange(facilityId, this.startDate, this.endDate).subscribe({
      next: (vaccinations) => {
        const total = vaccinations.length;
        const byVaccine = vaccinations.reduce((acc: any, v: any) => {
          const name = v.vaccineName || 'Unknown';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

        this.vaccinationStats = {
          total,
          byVaccine: Object.entries(byVaccine).map(([name, count]) => ({ name, count }))
        };

        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load vaccination stats:', error);
        this.errorMessage = 'Failed to load vaccination statistics';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadStockReport(facilityId: string, startTime: number): void {
    this.stockService.getStockLevels(facilityId).subscribe({
      next: (levels) => {
        this.stockReport = {
          totalVaccines: levels.length,
          totalDoses: levels.reduce((sum, l) => sum + (l.totalQuantity || l.currentQuantity || 0), 0),
          lowStock: levels.filter(l => l.status === 'LOW').length,
          outOfStock: levels.filter(l => l.status === 'CRITICAL' || l.totalQuantity === 0).length,
          details: levels.map(l => ({
            name: l.vaccineName,
            quantity: l.totalQuantity,
            status: l.status
          }))
        };

        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load stock report:', error);
        this.errorMessage = 'Failed to load stock data';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportReport(): void {
    // TODO: Implement CSV/Excel export
    alert('Export functionality coming soon!');
  }
}
