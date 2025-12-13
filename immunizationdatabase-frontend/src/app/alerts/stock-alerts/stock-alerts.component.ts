import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface StockAlert {
  id: number;
  type: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED' | 'REORDER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  vaccineName: string;
  batchNumber: string;
  message: string;
  quantity?: number;
  daysRemaining?: number;
  createdAt: string;
  status: 'UNREAD' | 'READ' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

interface AlertKPI {
  totalAlerts: number;
  criticalAlerts: number;
  pendingActions: number;
  resolvedToday: number;
}

interface NotificationPreference {
  email: boolean;
  sms: boolean;
  lowStockThreshold: number;
  expiryWarningDays: number;
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY';
}

interface AlertStatistic {
  date: string;
  totalAlerts: number;
  critical: number;
  resolved: number;
}

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule
  ],
  templateUrl: './stock-alerts.component.html',
  styleUrl: './stock-alerts.component.scss'
})
export class StockAlertsComponent implements OnInit {
  kpis: AlertKPI = {
    totalAlerts: 0,
    criticalAlerts: 0,
    pendingActions: 0,
    resolvedToday: 0
  };

  alerts: StockAlert[] = [];
  filteredAlerts: StockAlert[] = [];
  selectedAlerts: Set<number> = new Set();
  alertStatistics: AlertStatistic[] = [];

  notificationPreferences: NotificationPreference = {
    email: true,
    sms: false,
    lowStockThreshold: 20,
    expiryWarningDays: 30,
    frequency: 'IMMEDIATE'
  };

  // Filters
  selectedTab: number = 0;
  searchTerm: string = '';
  selectedSeverity: string = 'all';
  selectedAlertType: string = 'all';
  selectedStatus: string = 'all';
  startDate: Date | null = null;
  endDate: Date | null = null;

  severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  alertTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'EXPIRING', label: 'Expiring Soon' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'REORDER', label: 'Reorder Required' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'UNREAD', label: 'Unread' },
    { value: 'READ', label: 'Read' },
    { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'DISMISSED', label: 'Dismissed' }
  ];

  frequencyOptions = [
    { value: 'IMMEDIATE', label: 'Immediate' },
    { value: 'HOURLY', label: 'Hourly Digest' },
    { value: 'DAILY', label: 'Daily Summary' }
  ];

  displayedColumns: string[] = ['select', 'type', 'vaccine', 'batch', 'severity', 'message', 'info', 'created', 'status', 'actions'];

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadAlertsData();
  }

  loadAlertsData(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loadAlerts();
      this.calculateKPIs();
      this.generateStatistics();
      this.applyFilters();
      this.loaderService.hide();
      this.notificationService.showSuccess('Alerts data loaded successfully');
    }, 1000);
  }

  loadAlerts(): void {
    const currentDate = new Date('2024-12-11');
    
    // Generate mock alerts based on inventory data
    this.alerts = [
      {
        id: 1,
        type: 'EXPIRED',
        severity: 'CRITICAL',
        vaccineName: 'Polio',
        batchNumber: 'POLIO-2023-001',
        message: 'Batch has expired and should be disposed immediately',
        quantity: 50,
        daysRemaining: -11,
        createdAt: '2024-12-01T08:00:00',
        status: 'UNREAD'
      },
      {
        id: 2,
        type: 'EXPIRING',
        severity: 'CRITICAL',
        vaccineName: 'OPV',
        batchNumber: 'OPV-2024-002',
        message: 'Batch expiring in 5 days - prioritize usage',
        quantity: 350,
        daysRemaining: 5,
        createdAt: '2024-12-06T10:30:00',
        status: 'ACKNOWLEDGED'
      },
      {
        id: 3,
        type: 'EXPIRING',
        severity: 'HIGH',
        vaccineName: 'BCG',
        batchNumber: 'BCG-2024-002',
        message: 'Batch expiring in 10 days',
        quantity: 280,
        daysRemaining: 10,
        createdAt: '2024-12-01T09:15:00',
        status: 'READ'
      },
      {
        id: 4,
        type: 'LOW_STOCK',
        severity: 'HIGH',
        vaccineName: 'DTP',
        batchNumber: 'DTP-2024-002',
        message: 'Stock critically low - only 45 doses remaining',
        quantity: 45,
        createdAt: '2024-12-08T14:20:00',
        status: 'UNREAD'
      },
      {
        id: 5,
        type: 'LOW_STOCK',
        severity: 'MEDIUM',
        vaccineName: 'Measles',
        batchNumber: 'MEASLES-2024-002',
        message: 'Stock running low - 30 doses remaining',
        quantity: 30,
        createdAt: '2024-12-09T11:45:00',
        status: 'READ'
      },
      {
        id: 6,
        type: 'REORDER',
        severity: 'HIGH',
        vaccineName: 'DTP',
        batchNumber: 'Multiple',
        message: 'DTP stock is low across all batches - consider reordering',
        quantity: 645,
        createdAt: '2024-12-10T08:00:00',
        status: 'UNREAD'
      },
      {
        id: 7,
        type: 'REORDER',
        severity: 'MEDIUM',
        vaccineName: 'Measles',
        batchNumber: 'Multiple',
        message: 'Measles stock is medium - consider reordering',
        quantity: 530,
        createdAt: '2024-12-10T08:00:00',
        status: 'ACKNOWLEDGED'
      },
      {
        id: 8,
        type: 'EXPIRING',
        severity: 'MEDIUM',
        vaccineName: 'OPV',
        batchNumber: 'OPV-2024-002',
        message: 'Batch expiring in 25 days',
        quantity: 350,
        daysRemaining: 25,
        createdAt: '2024-11-16T10:00:00',
        status: 'RESOLVED',
        resolvedAt: '2024-12-05T14:30:00',
        resolvedBy: 'Facility Manager',
        notes: 'Prioritized in current campaign'
      },
      {
        id: 9,
        type: 'LOW_STOCK',
        severity: 'LOW',
        vaccineName: 'BCG',
        batchNumber: 'BCG-2024-001',
        message: 'Stock at 90% capacity - monitor levels',
        quantity: 450,
        createdAt: '2024-12-05T09:00:00',
        status: 'DISMISSED'
      },
      {
        id: 10,
        type: 'REORDER',
        severity: 'LOW',
        vaccineName: 'Hepatitis B',
        batchNumber: 'Multiple',
        message: 'Hepatitis B stock is good but plan ahead for next quarter',
        quantity: 700,
        createdAt: '2024-12-01T08:00:00',
        status: 'RESOLVED',
        resolvedAt: '2024-12-10T10:00:00',
        resolvedBy: 'Facility Manager',
        notes: 'Order placed for Q1 2025'
      }
    ];
  }

  calculateKPIs(): void {
    const totalAlerts = this.alerts.filter(a => a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length;
    const criticalAlerts = this.alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length;
    const pendingActions = this.alerts.filter(a => a.status === 'UNREAD' || a.status === 'READ').length;
    
    const today = new Date('2024-12-11').toISOString().split('T')[0];
    const resolvedToday = this.alerts.filter(a => 
      a.status === 'RESOLVED' && 
      a.resolvedAt && 
      a.resolvedAt.startsWith(today)
    ).length;

    this.kpis = {
      totalAlerts,
      criticalAlerts,
      pendingActions,
      resolvedToday
    };
  }

  generateStatistics(): void {
    // Generate last 7 days statistics
    const statistics: AlertStatistic[] = [];
    const baseDate = new Date('2024-12-11');

    for (let i = 6; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayAlerts = this.alerts.filter(a => a.createdAt.startsWith(dateStr));
      const criticalCount = dayAlerts.filter(a => a.severity === 'CRITICAL').length;
      const resolvedCount = this.alerts.filter(a => 
        a.resolvedAt && a.resolvedAt.startsWith(dateStr)
      ).length;

      statistics.push({
        date: dateStr,
        totalAlerts: dayAlerts.length,
        critical: criticalCount,
        resolved: resolvedCount
      });
    }

    this.alertStatistics = statistics;
  }

  applyFilters(): void {
    let filtered = [...this.alerts];

    // Tab filter
    if (this.selectedTab === 1) {
      filtered = filtered.filter(a => a.type === 'LOW_STOCK');
    } else if (this.selectedTab === 2) {
      filtered = filtered.filter(a => a.type === 'EXPIRING');
    } else if (this.selectedTab === 3) {
      filtered = filtered.filter(a => a.type === 'EXPIRED');
    } else if (this.selectedTab === 4) {
      filtered = filtered.filter(a => a.type === 'REORDER');
    }

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.vaccineName.toLowerCase().includes(search) ||
        a.batchNumber.toLowerCase().includes(search) ||
        a.message.toLowerCase().includes(search)
      );
    }

    // Severity filter
    if (this.selectedSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === this.selectedSeverity);
    }

    // Alert type filter
    if (this.selectedAlertType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedAlertType);
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    // Date range filter
    if (this.startDate) {
      filtered = filtered.filter(a => new Date(a.createdAt) >= this.startDate!);
    }
    if (this.endDate) {
      filtered = filtered.filter(a => new Date(a.createdAt) <= this.endDate!);
    }

    this.filteredAlerts = filtered;
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  toggleSelectAll(event: any): void {
    if (event.checked) {
      this.filteredAlerts.forEach(alert => this.selectedAlerts.add(alert.id));
    } else {
      this.selectedAlerts.clear();
    }
  }

  toggleSelect(alertId: number): void {
    if (this.selectedAlerts.has(alertId)) {
      this.selectedAlerts.delete(alertId);
    } else {
      this.selectedAlerts.add(alertId);
    }
  }

  isSelected(alertId: number): boolean {
    return this.selectedAlerts.has(alertId);
  }

  isAllSelected(): boolean {
    return this.filteredAlerts.length > 0 && 
           this.filteredAlerts.every(alert => this.selectedAlerts.has(alert.id));
  }

  getAlertIcon(type: string): string {
    const icons = {
      'LOW_STOCK': 'inventory_2',
      'EXPIRING': 'schedule',
      'EXPIRED': 'warning',
      'REORDER': 'shopping_cart'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusIcon(status: string): string {
    const icons = {
      'UNREAD': 'mark_email_unread',
      'READ': 'drafts',
      'ACKNOWLEDGED': 'check_circle_outline',
      'RESOLVED': 'check_circle',
      'DISMISSED': 'cancel'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  markAsRead(alert: StockAlert): void {
    if (alert.status === 'UNREAD') {
      this.loaderService.show();
      setTimeout(() => {
        alert.status = 'READ';
        this.calculateKPIs();
        this.loaderService.hide();
        this.notificationService.showSuccess('Alert marked as read');
      }, 500);
    }
  }

  acknowledgeAlert(alert: StockAlert): void {
    this.loaderService.show();
    setTimeout(() => {
      alert.status = 'ACKNOWLEDGED';
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showSuccess('Alert acknowledged');
    }, 800);
  }

  resolveAlert(alert: StockAlert): void {
    this.loaderService.show();
    setTimeout(() => {
      alert.status = 'RESOLVED';
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = this.authService.getCurrentUser()?.fullName || 'User';
      alert.notes = 'Manually resolved';
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showSuccess('Alert resolved');
    }, 800);
  }

  dismissAlert(alert: StockAlert): void {
    this.loaderService.show();
    setTimeout(() => {
      alert.status = 'DISMISSED';
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showInfo('Alert dismissed');
    }, 800);
  }

  bulkMarkAsRead(): void {
    if (this.selectedAlerts.size === 0) {
      this.notificationService.showWarning('No alerts selected');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.alerts.forEach(alert => {
        if (this.selectedAlerts.has(alert.id) && alert.status === 'UNREAD') {
          alert.status = 'READ';
        }
      });
      this.selectedAlerts.clear();
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showSuccess('Selected alerts marked as read');
    }, 1000);
  }

  bulkAcknowledge(): void {
    if (this.selectedAlerts.size === 0) {
      this.notificationService.showWarning('No alerts selected');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.alerts.forEach(alert => {
        if (this.selectedAlerts.has(alert.id) && alert.status !== 'RESOLVED' && alert.status !== 'DISMISSED') {
          alert.status = 'ACKNOWLEDGED';
        }
      });
      this.selectedAlerts.clear();
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showSuccess('Selected alerts acknowledged');
    }, 1000);
  }

  bulkResolve(): void {
    if (this.selectedAlerts.size === 0) {
      this.notificationService.showWarning('No alerts selected');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser()?.fullName || 'User';
      const timestamp = new Date().toISOString();
      
      this.alerts.forEach(alert => {
        if (this.selectedAlerts.has(alert.id)) {
          alert.status = 'RESOLVED';
          alert.resolvedAt = timestamp;
          alert.resolvedBy = currentUser;
          alert.notes = 'Bulk resolved';
        }
      });
      this.selectedAlerts.clear();
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showSuccess('Selected alerts resolved');
    }, 1000);
  }

  bulkDismiss(): void {
    if (this.selectedAlerts.size === 0) {
      this.notificationService.showWarning('No alerts selected');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.alerts.forEach(alert => {
        if (this.selectedAlerts.has(alert.id)) {
          alert.status = 'DISMISSED';
        }
      });
      this.selectedAlerts.clear();
      this.calculateKPIs();
      this.loaderService.hide();
      this.notificationService.showInfo('Selected alerts dismissed');
    }, 1000);
  }

  saveNotificationPreferences(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loaderService.hide();
      this.notificationService.showSuccess('Notification preferences saved');
    }, 1000);
  }

  exportAlertsReport(): void {
    this.loaderService.show();
    setTimeout(() => {
      const csvContent = this.generateAlertsCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-alerts-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.loaderService.hide();
      this.notificationService.showSuccess('Alerts report exported successfully');
    }, 1000);
  }

  generateAlertsCSV(): string {
    let csv = 'Stock Alerts Report\n\n';
    
    // KPIs
    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value\n';
    csv += `Total Active Alerts,${this.kpis.totalAlerts}\n`;
    csv += `Critical Alerts,${this.kpis.criticalAlerts}\n`;
    csv += `Pending Actions,${this.kpis.pendingActions}\n`;
    csv += `Resolved Today,${this.kpis.resolvedToday}\n\n`;

    // Alerts by Type
    csv += 'ALERTS BY TYPE\n';
    csv += 'Type,Count\n';
    ['LOW_STOCK', 'EXPIRING', 'EXPIRED', 'REORDER'].forEach(type => {
      const count = this.alerts.filter(a => a.type === type).length;
      csv += `${type},${count}\n`;
    });
    csv += '\n';

    // Alerts by Severity
    csv += 'ALERTS BY SEVERITY\n';
    csv += 'Severity,Count\n';
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      const count = this.alerts.filter(a => a.severity === severity).length;
      csv += `${severity},${count}\n`;
    });
    csv += '\n';

    // Alert Details
    csv += 'ALERT DETAILS\n';
    csv += 'ID,Type,Severity,Vaccine,Batch,Message,Quantity,Days Remaining,Created,Status,Resolved At,Resolved By\n';
    this.alerts.forEach(alert => {
      csv += `${alert.id},${alert.type},${alert.severity},${alert.vaccineName},${alert.batchNumber},"${alert.message}",${alert.quantity || 'N/A'},${alert.daysRemaining || 'N/A'},${alert.createdAt},${alert.status},${alert.resolvedAt || 'N/A'},${alert.resolvedBy || 'N/A'}\n`;
    });
    csv += '\n';

    // Statistics
    csv += 'ALERT STATISTICS (LAST 7 DAYS)\n';
    csv += 'Date,Total Alerts,Critical,Resolved\n';
    this.alertStatistics.forEach(stat => {
      csv += `${stat.date},${stat.totalAlerts},${stat.critical},${stat.resolved}\n`;
    });

    return csv;
  }

  refreshAlerts(): void {
    this.loadAlertsData();
  }

  // Helper methods for template to count alerts by type
  getAlertCountByType(type: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED' | 'REORDER'): number {
    return this.alerts.filter(a => a.type === type).length;
  }
}
