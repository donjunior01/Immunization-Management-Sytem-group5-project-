import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService, VaccineBatch } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-view-batch',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.scss']
})
export class ViewBatchComponent implements OnInit {
  batch: VaccineBatch | null = null;
  loading = true;
  currentUser: any;
  userRole: string = '';
  sidenavOpened = true;
  batchId: number | null = null;

  // Thresholds
  private readonly CRITICAL_DAYS = 30;
  private readonly LOW_STOCK = 1000;
  private readonly MEDIUM_STOCK = 2000;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.checkScreenSize();
    this.loadBatchData();
  }

  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.userRole = this.formatUserRole(user.role || 'Health Worker');
    }
  }

  formatUserRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Health Worker': 'Healthcare Professional',
      'Facility Manager': 'Facility Administrator',
      'Government Official': 'Health Authority'
    };
    return roleMap[role] || role;
  }

  checkScreenSize(): void {
    if (window.innerWidth < 1024) {
      this.sidenavOpened = false;
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadBatchData(): void {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.showError('Invalid batch ID');
      this.router.navigate(['/inventory']);
      return;
    }

    this.batchId = parseInt(id, 10);

    this.inventoryService.getBatchById(this.batchId).subscribe({
      next: (batch) => {
        this.batch = batch;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading batch:', error);
        this.showError('Failed to load batch details');
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/inventory']);
        }, 2000);
      }
    });
  }

  // Date & Status Methods
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysUntilExpiry(): number {
    if (!this.batch) return 0;
    const expiry = new Date(this.batch.expiry_date);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(): boolean {
    return this.getDaysUntilExpiry() < this.CRITICAL_DAYS;
  }

  getStatusClass(): string {
    if (!this.batch) return '';

    const daysUntilExpiry = this.getDaysUntilExpiry();

    if (daysUntilExpiry < this.CRITICAL_DAYS) {
      return 'status-critical';
    }

    if (this.batch.quantity < this.LOW_STOCK) {
      return 'status-low';
    }

    if (this.batch.quantity < this.MEDIUM_STOCK) {
      return 'status-medium';
    }

    return 'status-good';
  }

  getStatusIcon(): string {
    const statusClass = this.getStatusClass();

    if (statusClass === 'status-critical') return 'warning';
    if (statusClass === 'status-low') return 'error';
    if (statusClass === 'status-medium') return 'info';
    return 'check_circle';
  }

  getStatusLabel(): string {
    const statusClass = this.getStatusClass();

    if (statusClass === 'status-critical') return 'Critical Status';
    if (statusClass === 'status-low') return 'Low Stock';
    if (statusClass === 'status-medium') return 'Medium Stock';
    return 'Optimal Status';
  }

  getStatusTitle(): string {
    const statusClass = this.getStatusClass();

    if (statusClass === 'status-critical') return 'Immediate Action Required';
    if (statusClass === 'status-low') return 'Stock Replenishment Needed';
    if (statusClass === 'status-medium') return 'Monitor Stock Levels';
    return 'Batch Status: Optimal';
  }

  getStatusDescription(): string {
    if (!this.batch) return '';

    const daysUntilExpiry = this.getDaysUntilExpiry();
    const statusClass = this.getStatusClass();

    if (statusClass === 'status-critical') {
      return `This batch expires in ${daysUntilExpiry} days. Prioritize usage or transfer to high-demand locations.`;
    }

    if (statusClass === 'status-low') {
      return `Stock level is critically low (${this.batch.quantity} doses). Coordinate with supply chain for replenishment.`;
    }

    if (statusClass === 'status-medium') {
      return `Stock level is moderate (${this.batch.quantity} doses). Monitor consumption and plan reordering.`;
    }

    return `Batch is in optimal condition with ${this.batch.quantity} doses and ${daysUntilExpiry} days until expiry.`;
  }

  getDetailedStatus(): string {
    if (!this.batch) return '';

    const days = this.getDaysUntilExpiry();
    const quantity = this.batch.quantity;

    if (days < 30 && quantity < 1000) {
      return 'Expiring soon with low stock';
    } else if (days < 30) {
      return 'Approaching expiry date';
    } else if (quantity < 1000) {
      return 'Stock level is low';
    } else {
      return 'All parameters within range';
    }
  }

  getStockLevel(): string {
    if (!this.batch) return 'Unknown';

    if (this.batch.quantity >= this.MEDIUM_STOCK) return 'Optimal';
    if (this.batch.quantity >= this.LOW_STOCK) return 'Adequate';
    return 'Low';
  }

  getExpiryStatus(): string {
    const days = this.getDaysUntilExpiry();

    if (days < 30) return 'Critical';
    if (days < 90) return 'Attention';
    return 'Safe';
  }

  // Action Methods
  editBatch(): void {
    this.showInfo('Edit functionality will be implemented in Sprint 2');
    // this.router.navigate(['/inventory/edit', this.batchId]);
  }

  updateQuantity(): void {
    this.showInfo('Update quantity functionality will be implemented in Sprint 2');
  }

  deleteBatch(): void {
    if (!this.batch || !this.batchId) return;

    const confirmed = confirm(
      `Are you sure you want to delete batch ${this.batch.batch_number}?\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `- ${this.batch.quantity} doses of ${this.batch.vaccine_name}\n` +
      `- All associated history and records`
    );

    if (confirmed) {
      this.inventoryService.deleteBatch(this.batchId).subscribe({
        next: () => {
          this.showSuccess('Batch deleted successfully');
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Failed to delete batch. This feature is pending backend implementation.');
        }
      });
    }
  }

  exportPDF(): void {
    if (!this.batch) return;

    // Create a simple text report (PDF generation would require additional library)
    const report = this.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `batch-${this.batch.batch_number}-report.txt`;
    link.click();

    URL.revokeObjectURL(url);
    this.showSuccess('Report exported successfully');
  }

  private generateReport(): string {
    if (!this.batch) return '';

    return `
VACCINE BATCH REPORT
Generated: ${new Date().toLocaleString()}

==========================================
BATCH INFORMATION
==========================================

Vaccine Name: ${this.batch.vaccine_name}
Batch Number: ${this.batch.batch_number}
Manufacturer: ${this.batch.manufacturer}

Quantity: ${this.batch.quantity} doses
Expiry Date: ${this.formatDate(this.batch.expiry_date)}
Days Until Expiry: ${this.getDaysUntilExpiry()}

Storage Location: ${this.batch.storage_location || 'Not specified'}
Storage Temperature: ${this.batch.temperature ? this.batch.temperature + '°C' : 'Not specified'}

Status: ${this.getStatusLabel()}
Stock Level: ${this.getStockLevel()}
Expiry Status: ${this.getExpiryStatus()}

==========================================
ADDITIONAL INFORMATION
==========================================

Notes: ${this.batch.notes || 'None'}

Created: ${this.formatDate(this.batch.created_at || '')}
Created By: ${this.batch.created_by || 'Unknown'}
Last Updated: ${this.formatDate(this.batch.updated_at || '')}

==========================================
END OF REPORT
==========================================
    `.trim();
  }

  reportIssue(): void {
    this.showInfo('Issue reporting will be implemented in Sprint 2');
  }

  // Notification Methods
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}