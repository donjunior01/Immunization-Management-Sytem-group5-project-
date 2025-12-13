import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface UtilizationData {
  id: number;
  vaccineName: string;
  facilityId: string;
  facilityName: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  totalStock: number;
  administered: number;
  wastage: number;
  expired: number;
  remaining: number;
  utilizationRate: number;
  wastageRate: number;
  efficiencyScore: number;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

interface UtilizationStats {
  totalVaccinesAnalyzed: number;
  averageUtilizationRate: number;
  averageWastageRate: number;
  excellentPerformance: number;
  goodPerformance: number;
  fairPerformance: number;
  poorPerformance: number;
  totalDosesAdministered: number;
  totalDosesWasted: number;
}

interface TrendData {
  month: string;
  utilization: number;
  wastage: number;
  administered: number;
}

interface VaccinePerformance {
  vaccineName: string;
  totalDoses: number;
  administered: number;
  wastage: number;
  utilizationRate: number;
  wastageRate: number;
  efficiencyScore: number;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  recommendation: string;
}

interface FacilityComparison {
  facilityId: string;
  facilityName: string;
  utilizationRate: number;
  wastageRate: number;
  efficiencyScore: number;
  totalDosesAdministered: number;
  rank: number;
  performance: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

@Component({
  selector: 'app-utilization-analysis',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './utilization-analysis.component.html',
  styleUrl: './utilization-analysis.component.scss'
})
export class UtilizationAnalysisComponent implements OnInit {
  filterForm: FormGroup;
  utilizationData: UtilizationData[] = [];
  filteredUtilization: UtilizationData[] = [];
  stats: UtilizationStats = {
    totalVaccinesAnalyzed: 0,
    averageUtilizationRate: 0,
    averageWastageRate: 0,
    excellentPerformance: 0,
    goodPerformance: 0,
    fairPerformance: 0,
    poorPerformance: 0,
    totalDosesAdministered: 0,
    totalDosesWasted: 0
  };
  trendData: TrendData[] = [];
  vaccinePerformance: VaccinePerformance[] = [];
  facilityComparison: FacilityComparison[] = [];

  displayedColumns: string[] = ['vaccine', 'facility', 'period', 'utilization', 'wastage', 'efficiency', 'trend', 'status', 'actions'];

  vaccines: string[] = ['BCG', 'OPV', 'DTP', 'Measles', 'Hepatitis B', 'Rotavirus', 'Pneumococcal', 'HPV', 'Yellow Fever', 'Tetanus'];
  facilities = [
    { id: 'FAC001', name: 'Central Health Center' },
    { id: 'FAC002', name: 'District Hospital' },
    { id: 'FAC003', name: 'Regional Medical Center' },
    { id: 'FAC004', name: 'Community Clinic' },
    { id: 'FAC005', name: 'Rural Health Post' }
  ];

  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  showDetailDialog = false;
  selectedUtilization: UtilizationData | null = null;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      vaccineName: [''],
      facilityId: [''],
      status: [''],
      trend: [''],
      periodStart: [null],
      periodEnd: [null]
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    this.generateMockData();
    this.calculateStats();
    this.generateTrendData();
    this.generateVaccinePerformance();
    this.generateFacilityComparison();
    this.applyFilters();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  generateMockData(): void {
    if (this.utilizationData.length > 0) return;

    const statuses: Array<'Excellent' | 'Good' | 'Fair' | 'Poor'> = ['Excellent', 'Good', 'Fair', 'Poor'];
    const trends: Array<'Increasing' | 'Stable' | 'Decreasing'> = ['Increasing', 'Stable', 'Decreasing'];

    for (let i = 0; i < 50; i++) {
      const vaccine = this.vaccines[Math.floor(Math.random() * this.vaccines.length)];
      const facility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      const monthsAgo = Math.floor(Math.random() * 12);
      const periodStart = this.addMonths(new Date(), -monthsAgo - 1);
      const periodEnd = this.addMonths(periodStart, 1);

      const totalStock = Math.floor(Math.random() * 900) + 100;
      const administered = Math.floor(totalStock * (0.5 + Math.random() * 0.45));
      const wastage = Math.floor(totalStock * (Math.random() * 0.15));
      const expired = Math.floor(totalStock * (Math.random() * 0.1));
      const remaining = totalStock - administered - wastage - expired;

      const utilizationRate = (administered / totalStock) * 100;
      const wastageRate = ((wastage + expired) / totalStock) * 100;
      const efficiencyScore = utilizationRate - wastageRate;

      let status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      if (efficiencyScore >= 85) status = 'Excellent';
      else if (efficiencyScore >= 70) status = 'Good';
      else if (efficiencyScore >= 50) status = 'Fair';
      else status = 'Poor';

      this.utilizationData.push({
        id: i + 1,
        vaccineName: vaccine,
        facilityId: facility.id,
        facilityName: facility.name,
        period: this.formatPeriod(periodStart, periodEnd),
        periodStart,
        periodEnd,
        totalStock,
        administered,
        wastage,
        expired,
        remaining,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        wastageRate: Math.round(wastageRate * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        trend: trends[Math.floor(Math.random() * trends.length)],
        status
      });
    }

    this.utilizationData.sort((a, b) => b.periodStart.getTime() - a.periodStart.getTime());
    this.saveToLocalStorage();
  }

  calculateStats(): void {
    const data = this.utilizationData;
    
    this.stats.totalVaccinesAnalyzed = data.length;
    this.stats.averageUtilizationRate = data.length > 0 
      ? Math.round((data.reduce((sum, item) => sum + item.utilizationRate, 0) / data.length) * 10) / 10
      : 0;
    this.stats.averageWastageRate = data.length > 0
      ? Math.round((data.reduce((sum, item) => sum + item.wastageRate, 0) / data.length) * 10) / 10
      : 0;
    this.stats.excellentPerformance = data.filter(item => item.status === 'Excellent').length;
    this.stats.goodPerformance = data.filter(item => item.status === 'Good').length;
    this.stats.fairPerformance = data.filter(item => item.status === 'Fair').length;
    this.stats.poorPerformance = data.filter(item => item.status === 'Poor').length;
    this.stats.totalDosesAdministered = data.reduce((sum, item) => sum + item.administered, 0);
    this.stats.totalDosesWasted = data.reduce((sum, item) => sum + item.wastage + item.expired, 0);
  }

  generateTrendData(): void {
    this.trendData = [];
    const startDate = this.addMonths(new Date(), -11);

    for (let i = 0; i < 12; i++) {
      const month = this.addMonths(startDate, i);
      const monthData = this.utilizationData.filter(item => 
        item.periodStart.getMonth() === month.getMonth() &&
        item.periodStart.getFullYear() === month.getFullYear()
      );

      this.trendData.push({
        month: month.toLocaleString('default', { month: 'short', year: 'numeric' }),
        utilization: monthData.length > 0
          ? Math.round((monthData.reduce((sum, item) => sum + item.utilizationRate, 0) / monthData.length) * 10) / 10
          : 0,
        wastage: monthData.length > 0
          ? Math.round((monthData.reduce((sum, item) => sum + item.wastageRate, 0) / monthData.length) * 10) / 10
          : 0,
        administered: monthData.reduce((sum, item) => sum + item.administered, 0)
      });
    }
  }

  generateVaccinePerformance(): void {
    this.vaccinePerformance = [];

    for (const vaccine of this.vaccines) {
      const vaccineData = this.utilizationData.filter(item => item.vaccineName === vaccine);
      
      if (vaccineData.length === 0) continue;

      const totalDoses = vaccineData.reduce((sum, item) => sum + item.totalStock, 0);
      const administered = vaccineData.reduce((sum, item) => sum + item.administered, 0);
      const wastage = vaccineData.reduce((sum, item) => sum + item.wastage + item.expired, 0);
      const utilizationRate = (administered / totalDoses) * 100;
      const wastageRate = (wastage / totalDoses) * 100;
      const efficiencyScore = utilizationRate - wastageRate;

      // Determine trend based on last 3 months vs previous 3 months
      const recentData = vaccineData.slice(0, Math.min(3, vaccineData.length));
      const olderData = vaccineData.slice(3, Math.min(6, vaccineData.length));
      
      let trend: 'Increasing' | 'Stable' | 'Decreasing' = 'Stable';
      if (recentData.length > 0 && olderData.length > 0) {
        const recentAvg = recentData.reduce((sum, item) => sum + item.utilizationRate, 0) / recentData.length;
        const olderAvg = olderData.reduce((sum, item) => sum + item.utilizationRate, 0) / olderData.length;
        if (recentAvg > olderAvg + 5) trend = 'Increasing';
        else if (recentAvg < olderAvg - 5) trend = 'Decreasing';
      }

      let recommendation = '';
      if (utilizationRate < 70) {
        recommendation = 'Increase vaccination campaigns and outreach programs';
      } else if (wastageRate > 10) {
        recommendation = 'Implement better cold chain management and stock rotation';
      } else if (efficiencyScore >= 85) {
        recommendation = 'Maintain current practices and share best practices with other facilities';
      } else {
        recommendation = 'Review forecasting accuracy and adjust ordering patterns';
      }

      this.vaccinePerformance.push({
        vaccineName: vaccine,
        totalDoses,
        administered,
        wastage,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        wastageRate: Math.round(wastageRate * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        trend,
        recommendation
      });
    }

    this.vaccinePerformance.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  generateFacilityComparison(): void {
    this.facilityComparison = [];

    for (const facility of this.facilities) {
      const facilityData = this.utilizationData.filter(item => item.facilityId === facility.id);
      
      if (facilityData.length === 0) continue;

      const totalDoses = facilityData.reduce((sum, item) => sum + item.totalStock, 0);
      const administered = facilityData.reduce((sum, item) => sum + item.administered, 0);
      const wastage = facilityData.reduce((sum, item) => sum + item.wastage + item.expired, 0);
      const utilizationRate = (administered / totalDoses) * 100;
      const wastageRate = (wastage / totalDoses) * 100;
      const efficiencyScore = utilizationRate - wastageRate;

      let performance: 'Excellent' | 'Good' | 'Fair' | 'Poor';
      if (efficiencyScore >= 85) performance = 'Excellent';
      else if (efficiencyScore >= 70) performance = 'Good';
      else if (efficiencyScore >= 50) performance = 'Fair';
      else performance = 'Poor';

      this.facilityComparison.push({
        facilityId: facility.id,
        facilityName: facility.name,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        wastageRate: Math.round(wastageRate * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        totalDosesAdministered: administered,
        rank: 0,
        performance
      });
    }

    this.facilityComparison.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    this.facilityComparison.forEach((facility, index) => {
      facility.rank = index + 1;
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.utilizationData];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.vaccineName.toLowerCase().includes(search) ||
        item.facilityName.toLowerCase().includes(search) ||
        item.period.toLowerCase().includes(search)
      );
    }

    if (filters.vaccineName) {
      filtered = filtered.filter(item => item.vaccineName === filters.vaccineName);
    }

    if (filters.facilityId) {
      filtered = filtered.filter(item => item.facilityId === filters.facilityId);
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.trend) {
      filtered = filtered.filter(item => item.trend === filters.trend);
    }

    if (filters.periodStart) {
      filtered = filtered.filter(item => item.periodStart >= filters.periodStart);
    }

    if (filters.periodEnd) {
      filtered = filtered.filter(item => item.periodEnd <= filters.periodEnd);
    }

    this.filteredUtilization = filtered;
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccineName: '',
      facilityId: '',
      status: '',
      trend: '',
      periodStart: null,
      periodEnd: null
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedUtilization(): UtilizationData[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUtilization.slice(startIndex, endIndex);
  }

  viewUtilizationDetails(utilization: UtilizationData): void {
    this.selectedUtilization = utilization;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedUtilization = null;
  }

  exportUtilization(format: 'csv' | 'json' | 'pdf'): void {
    const data = this.filteredUtilization;

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      this.downloadFile(csv, 'utilization-analysis.csv', 'text/csv');
      this.notificationService.success('Exported to CSV successfully');
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, 'utilization-analysis.json', 'application/json');
      this.notificationService.success('Exported to JSON successfully');
    } else if (format === 'pdf') {
      this.notificationService.info('PDF export will be implemented with a reporting library');
    }
  }

  generateUtilizationReport(): void {
    this.loaderService.show();
    
    setTimeout(() => {
      this.notificationService.success('Utilization analysis report generated successfully');
    }, 1500);
  }

  private convertToCSV(data: UtilizationData[]): string {
    const headers = ['Vaccine', 'Facility', 'Period', 'Total Stock', 'Administered', 'Wastage', 'Expired', 'Remaining', 'Utilization Rate (%)', 'Wastage Rate (%)', 'Efficiency Score', 'Trend', 'Status'];
    const rows = data.map(item => [
      item.vaccineName,
      item.facilityName,
      item.period,
      item.totalStock,
      item.administered,
      item.wastage,
      item.expired,
      item.remaining,
      item.utilizationRate,
      item.wastageRate,
      item.efficiencyScore,
      item.trend,
      item.status
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' {
    switch (status) {
      case 'Excellent': return 'primary';
      case 'Good': return 'primary';
      case 'Fair': return 'accent';
      case 'Poor': return 'warn';
      default: return 'accent';
    }
  }

  getTrendColor(trend: string): 'primary' | 'accent' | 'warn' {
    switch (trend) {
      case 'Increasing': return 'primary';
      case 'Stable': return 'accent';
      case 'Decreasing': return 'warn';
      default: return 'accent';
    }
  }

  getPerformanceColor(performance: string): 'primary' | 'accent' | 'warn' {
    switch (performance) {
      case 'Excellent': return 'primary';
      case 'Good': return 'primary';
      case 'Fair': return 'accent';
      case 'Poor': return 'warn';
      default: return 'accent';
    }
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-US');
  }

  formatPeriod(start: Date, end: Date): string {
    return `${start.toLocaleString('default', { month: 'short', year: 'numeric' })} - ${end.toLocaleString('default', { month: 'short', year: 'numeric' })}`;
  }

  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('utilizationAnalysis', JSON.stringify(this.utilizationData));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('utilizationAnalysis');
    if (stored) {
      this.utilizationData = JSON.parse(stored).map((item: any) => ({
        ...item,
        periodStart: new Date(item.periodStart),
        periodEnd: new Date(item.periodEnd)
      }));
    }
  }
}
