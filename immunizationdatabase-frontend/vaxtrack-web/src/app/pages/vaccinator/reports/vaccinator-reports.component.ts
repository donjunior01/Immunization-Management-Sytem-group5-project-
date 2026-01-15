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
import { format, subMonths, startOfMonth, endOfMonth, parseISO, differenceInDays } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { forkJoin } from 'rxjs';

interface VaccinationStat {
  name: string;
  count: number;
  percentage?: number;
}

interface CoverageData {
  totalPatients: number;
  vaccinatedPatients: number;
  coverageRate: number;
  byVaccine: VaccinationStat[];
  monthlyTrend: { month: string; count: number }[];
}

interface VaccinationStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
  byVaccine: VaccinationStat[];
  recentVaccinations: any[];
}

interface StockReport {
  totalVaccines: number;
  totalDoses: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  details: { name: string; quantity: number; status: string; expiryDate?: string }[];
}

@Component({
  selector: 'app-vaccinator-reports',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    LayoutComponent, 
    LoaderComponent, 
    AlertComponent
  ],
  templateUrl: './vaccinator-reports.component.html',
  styleUrl: './vaccinator-reports.component.scss'
})
export class VaccinatorReportsComponent implements OnInit {
  loading = false;
  errorMessage = '';
  successMessage = '';
  reportType = 'coverage';
  dateRangeForm: FormGroup;
  
  // Report Data
  coverageData: CoverageData | null = null;
  vaccinationStats: VaccinationStats | null = null;
  stockReport: StockReport | null = null;
  
  // Date ranges
  startDate = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
  endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  
  private isLoadingData = false;
  private facilityId: string = '';

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
    const user = this.authService.getCurrentUser();
    this.facilityId = user?.facilityId || '';
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
    this.errorMessage = '';
    const startTime = Date.now();
    
    if (!this.facilityId) {
      this.errorMessage = 'No facility ID available. Please contact your administrator.';
      this.loading = false;
      this.isLoadingData = false;
      return;
    }

    switch (this.reportType) {
      case 'coverage':
        this.loadCoverageReport(startTime);
        break;
      case 'vaccinations':
        this.loadVaccinationStats(startTime);
        break;
      case 'stock':
        this.loadStockReport(startTime);
        break;
      default:
        this.loading = false;
        this.isLoadingData = false;
    }
  }

  private loadCoverageReport(startTime: number): void {
    forkJoin({
      patients: this.patientService.getPatientsByFacility(this.facilityId),
      vaccinations: this.vaccinationService.getVaccinationsByFacility(this.facilityId)
    }).subscribe({
      next: ({ patients, vaccinations }) => {
        // Filter vaccinations by date range
        const filteredVaccinations = vaccinations.filter(v => {
          const date = v.administeredDate || v.date;
          if (!date) return false;
          const vaccDate = new Date(date);
          const start = new Date(this.startDate);
          const end = new Date(this.endDate);
          return vaccDate >= start && vaccDate <= end;
        });
        
        const totalPatients = patients.length;
        const vaccinatedPatientIds = new Set(filteredVaccinations.map(v => v.patientId));
        const vaccinatedPatients = vaccinatedPatientIds.size;
        const coverageRate = totalPatients > 0 ? (vaccinatedPatients / totalPatients) * 100 : 0;
        
        // Group by vaccine
        const byVaccineMap = filteredVaccinations.reduce((acc: Record<string, number>, v) => {
          const vaccineName = v.vaccineName || 'Unknown';
          acc[vaccineName] = (acc[vaccineName] || 0) + 1;
          return acc;
        }, {});
        
        const totalVaccinations = filteredVaccinations.length;
        const byVaccine = Object.entries(byVaccineMap).map(([name, count]) => ({
          name,
          count: count as number,
          percentage: totalVaccinations > 0 ? ((count as number) / totalVaccinations) * 100 : 0
        })).sort((a, b) => b.count - a.count);

        // Group by month for trend
        const monthlyMap = filteredVaccinations.reduce((acc: Record<string, number>, v) => {
          const date = v.administeredDate || v.date;
          if (date) {
            const month = format(new Date(date), 'MMM yyyy');
            acc[month] = (acc[month] || 0) + 1;
          }
          return acc;
        }, {});
        
        const monthlyTrend = Object.entries(monthlyMap)
          .map(([month, count]) => ({ month, count: count as number }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        this.coverageData = {
          totalPatients,
          vaccinatedPatients,
          coverageRate: Math.round(coverageRate * 10) / 10,
          byVaccine,
          monthlyTrend
        };

        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load coverage report:', error);
        this.errorMessage = 'Failed to load coverage data. Please try again.';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadVaccinationStats(startTime: number): void {
    this.vaccinationService.getVaccinationsByFacility(this.facilityId).subscribe({
      next: (vaccinations) => {
        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Filter by date range
        const filteredVaccinations = vaccinations.filter(v => {
          const date = v.administeredDate || v.date;
          if (!date) return false;
          const vaccDate = new Date(date);
          const start = new Date(this.startDate);
          const end = new Date(this.endDate);
          return vaccDate >= start && vaccDate <= end;
        });
        
        const thisMonthVaccinations = vaccinations.filter(v => {
          const date = v.administeredDate || v.date;
          return date && new Date(date) >= thisMonthStart;
        });
        
        const thisWeekVaccinations = vaccinations.filter(v => {
          const date = v.administeredDate || v.date;
          return date && new Date(date) >= weekAgo;
        });
        
        // Group by vaccine
        const byVaccineMap = filteredVaccinations.reduce((acc: Record<string, number>, v) => {
          const name = v.vaccineName || 'Unknown';
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        
        const total = filteredVaccinations.length;
        const byVaccine = Object.entries(byVaccineMap).map(([name, count]) => ({
          name,
          count: count as number,
          percentage: total > 0 ? ((count as number) / total) * 100 : 0
        })).sort((a, b) => b.count - a.count);
        
        // Get recent vaccinations (last 10)
        const recentVaccinations = [...vaccinations]
          .sort((a, b) => {
            const dateA = new Date(a.administeredDate || a.date || 0);
            const dateB = new Date(b.administeredDate || b.date || 0);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 10)
          .map(v => ({
            patientName: v.patientName || 'Unknown Patient',
            vaccineName: v.vaccineName || 'Unknown',
            doseNumber: v.doseNumber || 1,
            date: v.administeredDate || v.date,
            administeredBy: v.administeredByName || v.administeredBy || 'Unknown'
          }));

        this.vaccinationStats = {
          total,
          thisMonth: thisMonthVaccinations.length,
          thisWeek: thisWeekVaccinations.length,
          byVaccine,
          recentVaccinations
        };

        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load vaccination stats:', error);
        this.errorMessage = 'Failed to load vaccination statistics. Please try again.';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadStockReport(startTime: number): void {
    this.stockService.getStockLevels(this.facilityId).subscribe({
      next: (levels) => {
        const now = new Date();
        const expiryThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        const expiringSoonCount = levels.filter(l => {
          const expiryDate = l.oldestExpiryDate;
          if (!expiryDate) return false;
          const expiry = new Date(expiryDate);
          return expiry <= expiryThreshold && expiry > now;
        }).length;
        
        this.stockReport = {
          totalVaccines: levels.length,
          totalDoses: levels.reduce((sum, l) => sum + (l.totalQuantity || l.currentQuantity || 0), 0),
          lowStock: levels.filter(l => l.status === 'LOW').length,
          outOfStock: levels.filter(l => l.status === 'CRITICAL' || l.status === 'OUT' || (l.totalQuantity || l.currentQuantity || 0) === 0).length,
          expiringSoon: expiringSoonCount,
          details: levels.map(l => ({
            name: l.vaccineName,
            quantity: l.totalQuantity || l.currentQuantity || 0,
            status: l.status || 'UNKNOWN',
            expiryDate: l.oldestExpiryDate
          })).sort((a, b) => {
            // Sort by status priority: CRITICAL/OUT, LOW, then others
            const statusOrder: Record<string, number> = { 'CRITICAL': 0, 'OUT': 0, 'LOW': 1, 'GOOD': 2, 'UNKNOWN': 3 };
            return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
          })
        };

        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load stock report:', error);
        this.errorMessage = 'Failed to load stock data. Please try again.';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportReport(): void {
    if (!this.coverageData && !this.vaccinationStats && !this.stockReport) {
      this.errorMessage = 'No data available to export.';
      return;
    }
    
    let csvContent = '';
    const filename = `vaxtrack-${this.reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    switch (this.reportType) {
      case 'coverage':
        if (this.coverageData) {
          csvContent = this.generateCoverageCsv();
        }
        break;
      case 'vaccinations':
        if (this.vaccinationStats) {
          csvContent = this.generateVaccinationsCsv();
        }
        break;
      case 'stock':
        if (this.stockReport) {
          csvContent = this.generateStockCsv();
        }
        break;
    }
    
    if (csvContent) {
      this.downloadCsv(csvContent, filename);
      this.successMessage = 'Report exported successfully!';
      setTimeout(() => this.successMessage = '', 3000);
    }
  }
  
  private generateCoverageCsv(): string {
    if (!this.coverageData) return '';
    
    let csv = 'Coverage Report\n';
    csv += `Date Range,${this.startDate} to ${this.endDate}\n`;
    csv += `Generated,${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Patients,${this.coverageData.totalPatients}\n`;
    csv += `Vaccinated Patients,${this.coverageData.vaccinatedPatients}\n`;
    csv += `Coverage Rate,${this.coverageData.coverageRate}%\n\n`;
    
    csv += 'Vaccinations by Vaccine Type\n';
    csv += 'Vaccine,Count,Percentage\n';
    this.coverageData.byVaccine.forEach(v => {
      csv += `${v.name},${v.count},${v.percentage?.toFixed(1)}%\n`;
    });
    
    return csv;
  }
  
  private generateVaccinationsCsv(): string {
    if (!this.vaccinationStats) return '';
    
    let csv = 'Vaccination Statistics Report\n';
    csv += `Date Range,${this.startDate} to ${this.endDate}\n`;
    csv += `Generated,${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Vaccinations,${this.vaccinationStats.total}\n`;
    csv += `This Month,${this.vaccinationStats.thisMonth}\n`;
    csv += `This Week,${this.vaccinationStats.thisWeek}\n\n`;
    
    csv += 'By Vaccine Type\n';
    csv += 'Vaccine,Count,Percentage\n';
    this.vaccinationStats.byVaccine.forEach(v => {
      csv += `${v.name},${v.count},${v.percentage?.toFixed(1)}%\n`;
    });
    
    csv += '\nRecent Vaccinations\n';
    csv += 'Patient,Vaccine,Dose,Date,Administered By\n';
    this.vaccinationStats.recentVaccinations.forEach(v => {
      csv += `${v.patientName},${v.vaccineName},${v.doseNumber},${v.date},${v.administeredBy}\n`;
    });
    
    return csv;
  }
  
  private generateStockCsv(): string {
    if (!this.stockReport) return '';
    
    let csv = 'Stock Report\n';
    csv += `Generated,${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    csv += 'Summary\n';
    csv += `Total Vaccine Types,${this.stockReport.totalVaccines}\n`;
    csv += `Total Doses,${this.stockReport.totalDoses}\n`;
    csv += `Low Stock Items,${this.stockReport.lowStock}\n`;
    csv += `Out of Stock,${this.stockReport.outOfStock}\n`;
    csv += `Expiring Soon (30 days),${this.stockReport.expiringSoon}\n\n`;
    
    csv += 'Stock Details\n';
    csv += 'Vaccine,Quantity,Status,Expiry Date\n';
    this.stockReport.details.forEach(d => {
      csv += `${d.name},${d.quantity},${d.status},${d.expiryDate || 'N/A'}\n`;
    });
    
    return csv;
  }
  
  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  }
  
  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'good' || statusLower === 'sufficient') return 'status-good';
    if (statusLower === 'low') return 'status-low';
    if (statusLower === 'critical' || statusLower === 'out_of_stock') return 'status-critical';
    return 'status-unknown';
  }
  
  getBarHeight(count: number, data: { month: string; count: number }[]): number {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return Math.max((count / maxCount) * 100, 10); // Minimum 10% height for visibility
  }
}
