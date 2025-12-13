import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

// Interfaces
interface StockKPI {
  totalConsumption: number;
  wastageRate: number;
  stockTurnover: number;
  reorderFrequency: number;
  averageUsage: number;
  utilizationRate: number;
}

interface UsagePattern {
  vaccineName: string;
  totalUsed: number;
  averageMonthly: number;
  peakMonth: string;
  peakUsage: number;
  trend: string;
  growthRate: number;
}

interface WastageData {
  vaccineName: string;
  totalWasted: number;
  wastageRate: number;
  expiryWaste: number;
  damageWaste: number;
  otherWaste: number;
  costImpact: number;
  severity: string;
}

interface TurnoverData {
  vaccineName: string;
  turnoverRate: number;
  averageStock: number;
  daysInStock: number;
  reorderPoint: number;
  status: string;
  lastReorder: string;
}

interface MonthlyUsage {
  month: string;
  bcg: number;
  opv: number;
  dtp: number;
  measles: number;
  hepatitis: number;
  polio: number;
}

interface ReorderAnalytics {
  vaccineName: string;
  currentStock: number;
  reorderLevel: number;
  optimalOrder: number;
  leadTime: number;
  lastOrderDate: string;
  nextOrderDue: string;
  status: string;
}

interface StockMovement {
  date: string;
  vaccineName: string;
  movementType: string;
  quantity: number;
  remainingStock: number;
  batchNumber: string;
  notes: string;
}

@Component({
  selector: 'app-stock-report',
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
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './stock-report.component.html',
  styleUrl: './stock-report.component.scss'
})
export class StockReportComponent implements OnInit {
  // KPIs
  kpis: StockKPI = {
    totalConsumption: 0,
    wastageRate: 0,
    stockTurnover: 0,
    reorderFrequency: 0,
    averageUsage: 0,
    utilizationRate: 0
  };

  // Data arrays
  usagePatterns: UsagePattern[] = [];
  wastageData: WastageData[] = [];
  turnoverData: TurnoverData[] = [];
  monthlyUsage: MonthlyUsage[] = [];
  reorderAnalytics: ReorderAnalytics[] = [];
  stockMovements: StockMovement[] = [];

  // Filters
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedVaccine: string = '';
  selectedPeriod: string = 'last-3-months';

  // Options
  vaccineOptions: string[] = ['All Vaccines', 'BCG', 'OPV', 'DTP', 'Measles', 'Hepatitis B', 'Polio'];
  periodOptions = [
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Table columns
  usageDisplayedColumns: string[] = ['vaccine', 'totalUsed', 'averageMonthly', 'peakMonth', 'trend', 'growth'];
  wastageDisplayedColumns: string[] = ['vaccine', 'totalWasted', 'wastageRate', 'expiry', 'damage', 'costImpact', 'severity'];
  turnoverDisplayedColumns: string[] = ['vaccine', 'turnoverRate', 'averageStock', 'daysInStock', 'reorderPoint', 'status'];
  reorderDisplayedColumns: string[] = ['vaccine', 'currentStock', 'reorderLevel', 'optimalOrder', 'leadTime', 'nextDue', 'status'];
  movementDisplayedColumns: string[] = ['date', 'vaccine', 'type', 'quantity', 'remaining', 'batch', 'notes'];

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStockReport();
  }

  loadStockReport(): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      this.loadKPIs();
      this.loadUsagePatterns();
      this.loadWastageData();
      this.loadTurnoverData();
      this.loadMonthlyUsage();
      this.loadReorderAnalytics();
      this.loadStockMovements();
    }, 1000);
  }

  loadKPIs(): void {
    this.kpis = {
      totalConsumption: 4567,
      wastageRate: 3.2,
      stockTurnover: 8.5,
      reorderFrequency: 12,
      averageUsage: 763,
      utilizationRate: 94.8
    };
  }

  loadUsagePatterns(): void {
    this.usagePatterns = [
      { vaccineName: 'BCG', totalUsed: 1245, averageMonthly: 207, peakMonth: 'Nov 2024', peakUsage: 312, trend: 'UP', growthRate: 12.5 },
      { vaccineName: 'OPV', totalUsed: 987, averageMonthly: 164, peakMonth: 'Oct 2024', peakUsage: 245, trend: 'UP', growthRate: 8.3 },
      { vaccineName: 'DTP', totalUsed: 856, averageMonthly: 143, peakMonth: 'Sep 2024', peakUsage: 198, trend: 'STABLE', growthRate: 2.1 },
      { vaccineName: 'Measles', totalUsed: 723, averageMonthly: 121, peakMonth: 'Nov 2024', peakUsage: 176, trend: 'UP', growthRate: 15.7 },
      { vaccineName: 'Hepatitis B', totalUsed: 612, averageMonthly: 102, peakMonth: 'Oct 2024', peakUsage: 134, trend: 'STABLE', growthRate: 1.8 },
      { vaccineName: 'Polio', totalUsed: 544, averageMonthly: 91, peakMonth: 'Aug 2024', peakUsage: 118, trend: 'DOWN', growthRate: -3.4 }
    ];
  }

  loadWastageData(): void {
    this.wastageData = [
      { vaccineName: 'BCG', totalWasted: 45, wastageRate: 3.6, expiryWaste: 30, damageWaste: 10, otherWaste: 5, costImpact: 2250, severity: 'MEDIUM' },
      { vaccineName: 'OPV', totalWasted: 38, wastageRate: 3.9, expiryWaste: 28, damageWaste: 7, otherWaste: 3, costImpact: 1900, severity: 'MEDIUM' },
      { vaccineName: 'DTP', totalWasted: 52, wastageRate: 6.1, expiryWaste: 42, damageWaste: 8, otherWaste: 2, costImpact: 3120, severity: 'HIGH' },
      { vaccineName: 'Measles', totalWasted: 28, wastageRate: 3.9, expiryWaste: 20, damageWaste: 6, otherWaste: 2, costImpact: 1680, severity: 'MEDIUM' },
      { vaccineName: 'Hepatitis B', totalWasted: 19, wastageRate: 3.1, expiryWaste: 15, damageWaste: 3, otherWaste: 1, costImpact: 1330, severity: 'LOW' },
      { vaccineName: 'Polio', totalWasted: 15, wastageRate: 2.8, expiryWaste: 12, damageWaste: 2, otherWaste: 1, costImpact: 750, severity: 'LOW' }
    ];
  }

  loadTurnoverData(): void {
    this.turnoverData = [
      { vaccineName: 'BCG', turnoverRate: 10.2, averageStock: 450, daysInStock: 36, reorderPoint: 150, status: 'OPTIMAL', lastReorder: '2024-11-15' },
      { vaccineName: 'OPV', turnoverRate: 9.8, averageStock: 720, daysInStock: 37, reorderPoint: 250, status: 'OPTIMAL', lastReorder: '2024-11-20' },
      { vaccineName: 'DTP', turnoverRate: 7.5, averageStock: 550, daysInStock: 49, reorderPoint: 200, status: 'SLOW', lastReorder: '2024-10-28' },
      { vaccineName: 'Measles', turnoverRate: 8.9, averageStock: 480, daysInStock: 41, reorderPoint: 180, status: 'OPTIMAL', lastReorder: '2024-11-10' },
      { vaccineName: 'Hepatitis B', turnoverRate: 6.8, averageStock: 650, daysInStock: 54, reorderPoint: 220, status: 'SLOW', lastReorder: '2024-10-15' },
      { vaccineName: 'Polio', turnoverRate: 11.5, averageStock: 380, daysInStock: 32, reorderPoint: 130, status: 'FAST', lastReorder: '2024-11-25' }
    ];
  }

  loadMonthlyUsage(): void {
    this.monthlyUsage = [
      { month: 'Jul 2024', bcg: 195, opv: 158, dtp: 142, measles: 118, hepatitis: 98, polio: 87 },
      { month: 'Aug 2024', bcg: 203, opv: 165, dtp: 145, measles: 121, hepatitis: 102, polio: 118 },
      { month: 'Sep 2024', bcg: 208, opv: 172, dtp: 198, measles: 124, hepatitis: 105, polio: 95 },
      { month: 'Oct 2024', bcg: 215, opv: 245, dtp: 153, measles: 134, hepatitis: 134, polio: 92 },
      { month: 'Nov 2024', bcg: 312, opv: 189, dtp: 165, measles: 176, hepatitis: 109, polio: 88 },
      { month: 'Dec 2024', bcg: 112, opv: 58, dtp: 53, measles: 50, hepatitis: 64, polio: 64 }
    ];
  }

  loadReorderAnalytics(): void {
    this.reorderAnalytics = [
      { vaccineName: 'BCG', currentStock: 450, reorderLevel: 150, optimalOrder: 500, leadTime: 14, lastOrderDate: '2024-11-15', nextOrderDue: '2025-01-20', status: 'NORMAL' },
      { vaccineName: 'OPV', currentStock: 850, reorderLevel: 250, optimalOrder: 800, leadTime: 10, lastOrderDate: '2024-11-20', nextOrderDue: '2025-01-15', status: 'NORMAL' },
      { vaccineName: 'DTP', currentStock: 145, reorderLevel: 200, optimalOrder: 600, leadTime: 12, lastOrderDate: '2024-10-28', nextOrderDue: '2024-12-15', status: 'URGENT' },
      { vaccineName: 'Measles', currentStock: 500, reorderLevel: 180, optimalOrder: 550, leadTime: 15, lastOrderDate: '2024-11-10', nextOrderDue: '2025-01-25', status: 'NORMAL' },
      { vaccineName: 'Hepatitis B', currentStock: 700, reorderLevel: 220, optimalOrder: 700, leadTime: 18, lastOrderDate: '2024-10-15', nextOrderDue: '2025-02-01', status: 'NORMAL' },
      { vaccineName: 'Polio', currentStock: 180, reorderLevel: 130, optimalOrder: 450, leadTime: 7, lastOrderDate: '2024-11-25', nextOrderDue: '2024-12-20', status: 'WATCH' }
    ];
  }

  loadStockMovements(): void {
    this.stockMovements = [
      { date: '2024-12-10', vaccineName: 'BCG', movementType: 'OUT', quantity: 25, remainingStock: 450, batchNumber: 'BCG-2024-001', notes: 'Daily vaccination' },
      { date: '2024-12-09', vaccineName: 'Measles', movementType: 'OUT', quantity: 18, remainingStock: 500, batchNumber: 'MEASLES-2024-001', notes: 'Campaign usage' },
      { date: '2024-12-08', vaccineName: 'DTP', movementType: 'IN', quantity: 200, remainingStock: 145, batchNumber: 'DTP-2024-003', notes: 'Emergency restock' },
      { date: '2024-12-08', vaccineName: 'OPV', movementType: 'OUT', quantity: 32, remainingStock: 850, batchNumber: 'OPV-2024-001', notes: 'Routine vaccination' },
      { date: '2024-12-07', vaccineName: 'Hepatitis B', movementType: 'WASTE', quantity: 5, remainingStock: 700, batchNumber: 'HEPATITIS-2024-001', notes: 'Damaged vials' },
      { date: '2024-12-07', vaccineName: 'BCG', movementType: 'OUT', quantity: 28, remainingStock: 475, batchNumber: 'BCG-2024-001', notes: 'Newborn vaccination' },
      { date: '2024-12-06', vaccineName: 'Polio', movementType: 'OUT', quantity: 15, remainingStock: 180, batchNumber: 'POLIO-2024-001', notes: 'Clinic usage' },
      { date: '2024-12-05', vaccineName: 'DTP', movementType: 'WASTE', quantity: 8, remainingStock: -55, batchNumber: 'DTP-2024-002', notes: 'Expired batch' }
    ];
  }

  applyFilters(): void {
    this.loaderService.show(800);
    setTimeout(() => {
      this.notificationService.success('Filters applied successfully');
      this.loadStockReport();
    }, 800);
  }

  resetFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.selectedVaccine = '';
    this.selectedPeriod = 'last-3-months';
    this.applyFilters();
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

  getSeverityClass(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'severity-high';
      case 'MEDIUM': return 'severity-medium';
      case 'LOW': return 'severity-low';
      default: return '';
    }
  }

  getTurnoverStatusClass(status: string): string {
    switch (status) {
      case 'OPTIMAL': return 'turnover-optimal';
      case 'FAST': return 'turnover-fast';
      case 'SLOW': return 'turnover-slow';
      default: return '';
    }
  }

  getReorderStatusClass(status: string): string {
    switch (status) {
      case 'URGENT': return 'reorder-urgent';
      case 'WATCH': return 'reorder-watch';
      case 'NORMAL': return 'reorder-normal';
      default: return '';
    }
  }

  getMovementTypeClass(type: string): string {
    switch (type) {
      case 'IN': return 'movement-in';
      case 'OUT': return 'movement-out';
      case 'WASTE': return 'movement-waste';
      default: return '';
    }
  }

  exportReport(format: string): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      if (format === 'csv') this.generateCSV();
      else if (format === 'pdf') this.generatePDF();
    }, 1000);
  }

  generateCSV(): void {
    let csv = 'Stock Report - Immunization Database\n\n';
    
    // KPIs
    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value\n';
    csv += `Total Consumption,${this.kpis.totalConsumption}\n`;
    csv += `Wastage Rate,${this.kpis.wastageRate}%\n`;
    csv += `Stock Turnover,${this.kpis.stockTurnover}\n`;
    csv += `Reorder Frequency,${this.kpis.reorderFrequency}\n`;
    csv += `Average Usage,${this.kpis.averageUsage}\n`;
    csv += `Utilization Rate,${this.kpis.utilizationRate}%\n\n`;

    // Usage Patterns
    csv += 'USAGE PATTERNS\n';
    csv += 'Vaccine,Total Used,Avg Monthly,Peak Month,Peak Usage,Trend,Growth Rate\n';
    this.usagePatterns.forEach(u => {
      csv += `${u.vaccineName},${u.totalUsed},${u.averageMonthly},${u.peakMonth},${u.peakUsage},${u.trend},${u.growthRate}%\n`;
    });
    csv += '\n';

    // Wastage Data
    csv += 'WASTAGE ANALYSIS\n';
    csv += 'Vaccine,Total Wasted,Wastage Rate,Expiry,Damage,Other,Cost Impact,Severity\n';
    this.wastageData.forEach(w => {
      csv += `${w.vaccineName},${w.totalWasted},${w.wastageRate}%,${w.expiryWaste},${w.damageWaste},${w.otherWaste},${w.costImpact},${w.severity}\n`;
    });
    csv += '\n';

    // Turnover Data
    csv += 'STOCK TURNOVER\n';
    csv += 'Vaccine,Turnover Rate,Avg Stock,Days in Stock,Reorder Point,Status,Last Reorder\n';
    this.turnoverData.forEach(t => {
      csv += `${t.vaccineName},${t.turnoverRate},${t.averageStock},${t.daysInStock},${t.reorderPoint},${t.status},${t.lastReorder}\n`;
    });
    csv += '\n';

    // Reorder Analytics
    csv += 'REORDER ANALYTICS\n';
    csv += 'Vaccine,Current Stock,Reorder Level,Optimal Order,Lead Time,Last Order,Next Order Due,Status\n';
    this.reorderAnalytics.forEach(r => {
      csv += `${r.vaccineName},${r.currentStock},${r.reorderLevel},${r.optimalOrder},${r.leadTime},${r.lastOrderDate},${r.nextOrderDue},${r.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.notificationService.success('CSV report downloaded successfully');
  }

  generatePDF(): void {
    this.notificationService.info('PDF generation would require additional library (e.g., jsPDF)');
  }

  refreshReport(): void {
    this.loadStockReport();
    this.notificationService.success('Report refreshed successfully');
  }

  generateReorderList(): void {
    const urgent = this.reorderAnalytics.filter(r => r.status === 'URGENT' || r.status === 'WATCH');
    if (urgent.length > 0) {
      this.notificationService.info(`${urgent.length} vaccine(s) need reordering`);
    } else {
      this.notificationService.success('All stock levels are normal');
    }
  }
}
