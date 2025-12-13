import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';

interface ExpiryAlert {
  id: number;
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  quantityRemaining: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  severity: 'critical' | 'warning' | 'info';
}

@Component({
  selector: 'app-expiry-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './expiry-alerts.component.html',
  styleUrls: ['./expiry-alerts.component.scss']
})
export class ExpiryAlertsComponent implements OnInit {
  alerts: ExpiryAlert[] = [];
  displayedColumns: string[] = ['severity', 'batchNumber', 'vaccineName', 'manufacturer', 'quantityRemaining', 'expiryDate', 'daysUntilExpiry', 'actions'];

  criticalCount = 0;
  warningCount = 0;
  infoCount = 0;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadExpiryAlerts();
  }

  loadExpiryAlerts(): void {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login...');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.inventoryService.getAllBatches().subscribe({
      next: (batches) => {
        const today = new Date();

        this.alerts = batches
          .map(batch => {
            const expiryDate = new Date(batch.expiry_date);
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            let severity: 'critical' | 'warning' | 'info';
            if (daysUntilExpiry < 0) {
              severity = 'critical';
            } else if (daysUntilExpiry <= 30) {
              severity = 'critical';
            } else if (daysUntilExpiry <= 90) {
              severity = 'warning';
            } else {
              severity = 'info';
            }

            return {
              id: batch.id || 0,
              batchNumber: batch.batch_number,
              vaccineName: batch.vaccine_name,
              manufacturer: batch.manufacturer || 'Unknown',
              quantityRemaining: batch.quantity || 0,
              expiryDate: expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              severity: severity
            };
          })
          .filter(alert => alert.daysUntilExpiry <= 90) // Show only alerts within 90 days
          .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

        this.updateCounts();
      },
      error: (error) => {
        console.error('Error loading expiry alerts:', error);

        if (error.status === 403 || error.status === 401) {
          this.snackBar.open('Authentication required. Please log in.', 'Close', { duration: 3000 });
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else {
          this.snackBar.open('Failed to load expiry alerts', 'Close', { duration: 3000 });
        }
      }
    });
  }

  updateCounts(): void {
    this.criticalCount = this.alerts.filter(a => a.severity === 'critical').length;
    this.warningCount = this.alerts.filter(a => a.severity === 'warning').length;
    this.infoCount = this.alerts.filter(a => a.severity === 'info').length;
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'warn';
      case 'warning': return 'accent';
      case 'info': return 'primary';
      default: return 'primary';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusText(daysUntilExpiry: number): string {
    if (daysUntilExpiry < 0) {
      return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    } else if (daysUntilExpiry === 0) {
      return 'Expires today';
    } else if (daysUntilExpiry === 1) {
      return 'Expires tomorrow';
    } else {
      return `${daysUntilExpiry} days remaining`;
    }
  }

  handleBatch(batchId: number): void {
    console.log('Handle batch:', batchId);
    // Implement batch handling logic (e.g., mark as handled, create order, etc.)
  }

  viewBatchDetails(batchId: number): void {
    console.log('View batch details:', batchId);
    // Navigate to batch details
  }
}
