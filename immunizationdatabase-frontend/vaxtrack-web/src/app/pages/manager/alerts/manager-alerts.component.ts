import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { StockService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

@Component({
  selector: 'app-manager-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-alerts.component.html',
  styleUrl: './manager-alerts.component.scss'
})
export class ManagerAlertsComponent implements OnInit {
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  loading = false;
  errorMessage = '';
  filterType = 'all';
  showUnreadOnly = false;
  private isLoadingData = false;

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
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

    // Generate alerts from stock data
    this.stockService.getStockLevels(facilityId).subscribe({
      next: (levels) => {
        this.generateAlerts(levels);
        this.applyFilters();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load alerts:', error);
        this.errorMessage = 'Failed to load alerts';
        this.alerts = [];
        this.filteredAlerts = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private generateAlerts(levels: any[]): void {
    this.alerts = [];
    
    // Out of stock alerts
    levels.filter(l => l.status === 'CRITICAL' || l.totalQuantity === 0).forEach(level => {
      this.alerts.push({
        id: `out-${level.vaccineId}`,
        type: 'error',
        title: 'Out of Stock',
        message: `${level.vaccineName} is out of stock. Please order immediately.`,
        timestamp: new Date(),
        read: false,
        actionUrl: '/manager/stock'
      });
    });

    // Low stock alerts
    levels.filter(l => l.status === 'LOW').forEach(level => {
      this.alerts.push({
        id: `low-${level.vaccineId}`,
        type: 'warning',
        title: 'Low Stock',
        message: `${level.vaccineName} is running low (${level.totalQuantity} doses remaining).`,
        timestamp: new Date(),
        read: false,
        actionUrl: '/manager/stock'
      });
    });

    // Expiring batches
    this.stockService.getExpiringBatches(this.authService.getCurrentUser()?.facilityId, 30).subscribe({
      next: (batches) => {
        batches.slice(0, 5).forEach(batch => {
          this.alerts.push({
            id: `exp-${batch.id}`,
            type: 'warning',
            title: 'Expiring Soon',
            message: `${batch.vaccineName} batch ${batch.batchNumber} expires on ${new Date(batch.expiryDate).toLocaleDateString()}.`,
            timestamp: new Date(),
            read: false,
            actionUrl: '/manager/stock'
          });
        });
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });

    // Sort by timestamp (newest first)
    this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  applyFilters(): void {
    let filtered = [...this.alerts];
    
    if (this.filterType !== 'all') {
      filtered = filtered.filter(a => a.type === this.filterType);
    }
    
    if (this.showUnreadOnly) {
      filtered = filtered.filter(a => !a.read);
    }
    
    this.filteredAlerts = filtered;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  markAsRead(alert: Alert): void {
    alert.read = true;
    this.applyFilters();
  }

  markAllAsRead(): void {
    this.alerts.forEach(a => a.read = true);
    this.applyFilters();
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  getUnreadCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }

  getErrorCount(): number {
    return this.alerts.filter(a => a.type === 'error').length;
  }

  getWarningCount(): number {
    return this.alerts.filter(a => a.type === 'warning').length;
  }

  getAlertClasses(alert: Alert): { [key: string]: boolean } {
    return {
      'unread': !alert.read,
      'alert-error': alert.type === 'error',
      'alert-warning': alert.type === 'warning',
      'alert-info': alert.type === 'info'
    };
  }
}
