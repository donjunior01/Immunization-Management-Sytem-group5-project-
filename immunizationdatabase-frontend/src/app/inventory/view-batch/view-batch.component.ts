import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { InventoryRealService, VaccineBatchResponse } from '../../services/inventory-real.service';
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
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule
  ],
  templateUrl: './view-batch.component.html',
  styleUrls: ['./view-batch.component.scss']
})
export class ViewBatchComponent implements OnInit {
  batch: VaccineBatchResponse | null = null;
  isLoading = true;
  currentUser: any;
  userRole: string = '';
  batchId: number | null = null;
  sidenavOpened = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inventoryService: InventoryRealService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserData();
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

  loadBatchData(): void {
    this.isLoading = true;
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
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading batch:', error);
        this.showError('Failed to load batch details');
        this.isLoading = false;
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
      day: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(): string {
    if (!this.batch) return 'primary';
    
    if (this.batch.isExpired) return 'warn';
    if (this.batch.isExpiringSoon) return 'accent';
    if (this.batch.quantityRemaining === 0) return 'warn';
    if (this.batch.quantityRemaining <= 10) return 'accent';
    return 'primary';
  }

  getStatusIcon(): string {
    if (!this.batch) return 'info';
    
    if (this.batch.isExpired) return 'dangerous';
    if (this.batch.isExpiringSoon) return 'warning';
    if (this.batch.quantityRemaining === 0) return 'inventory_2';
    if (this.batch.quantityRemaining <= 10) return 'trending_down';
    return 'check_circle';
  }

  getStatusLabel(): string {
    if (!this.batch) return 'Unknown';
    
    if (this.batch.isExpired) return 'Expired';
    if (this.batch.isExpiringSoon) return `Expiring Soon (${this.batch.daysUntilExpiry}d)`;
    if (this.batch.quantityRemaining === 0) return 'Out of Stock';
    if (this.batch.quantityRemaining <= 10) return 'Low Stock';
    return 'Available';
  }

  getStatusDescription(): string {
    if (!this.batch) return '';

    if (this.batch.isExpired) {
      return 'This batch has expired and should be removed from active inventory immediately.';
    }

    if (this.batch.isExpiringSoon) {
      return `This batch expires in ${this.batch.daysUntilExpiry} days. Prioritize usage or transfer to high-demand locations.`;
    }

    if (this.batch.quantityRemaining === 0) {
      return 'This batch is out of stock. Consider reordering or updating inventory records.';
    }

    if (this.batch.quantityRemaining <= 10) {
      return `Stock level is critically low (${this.batch.quantityRemaining} doses). Coordinate with supply chain for replenishment.`;
    }

    return `Batch is in optimal condition with ${this.batch.quantityRemaining} doses available and ${this.batch.daysUntilExpiry} days until expiry.`;
  }

  getStockPercentage(): number {
    if (!this.batch || this.batch.quantityReceived === 0) return 0;
    return Math.round((this.batch.quantityRemaining / this.batch.quantityReceived) * 100);
  }

  getStockLevel(): string {
    if (!this.batch) return 'Unknown';

    const percentage = this.getStockPercentage();

    if (percentage >= 75) return 'Optimal';
    if (percentage >= 50) return 'Good';
    if (percentage >= 25) return 'Adequate';
    return 'Low';
  }

  getExpiryStatus(): string {
    if (!this.batch) return 'Unknown';

    if (this.batch.isExpired) return 'Expired';
    if (this.batch.daysUntilExpiry < 30) return 'Critical';
    if (this.batch.daysUntilExpiry < 90) return 'Attention';
    return 'Safe';
  }

  getStatusTitle(): string {
    return this.getStatusLabel();
  }

  getStatusClass(): string {
    if (!this.batch) return '';
    
    if (this.batch.isExpired) return 'expired';
    if (this.batch.isExpiringSoon) return 'expiring-soon';
    if (this.batch.quantityRemaining === 0) return 'out-of-stock';
    if (this.batch.quantityRemaining <= 10) return 'low-stock';
    return 'available';
  }

  getDetailedStatus(): string {
    return this.getStatusDescription();
  }

  isExpiringSoon(): boolean {
    return this.batch?.isExpiringSoon || false;
  }

  getDaysUntilExpiry(): number {
    return this.batch?.daysUntilExpiry || 0;
  }

  exportPDF(): void {
    this.exportReport();
  }

  updateQuantity(): void {
    this.showInfo('Quantity update feature coming soon');
  }

  reportIssue(): void {
    this.showInfo('Issue reporting feature coming soon');
  }

  // Action Methods
  editBatch(): void {
    if (!this.batchId) return;
    this.router.navigate(['/inventory/add-batch'], {
      queryParams: { batchId: this.batchId }
    });
  }

  deleteBatch(): void {
    if (!this.batch || !this.batchId) return;

    const confirmed = confirm(
      `Are you sure you want to delete batch ${this.batch.batchNumber}?\n\n` +
      `This will permanently remove:\n` +
      `- ${this.batch.quantityRemaining} remaining doses of ${this.batch.vaccineName}\n` +
      `- All associated history and records\n\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      this.isLoading = true;
      this.inventoryService.deleteBatch(this.batchId).subscribe({
        next: () => {
          this.showSuccess('Batch deleted successfully');
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Failed to delete batch: ' + (error.error?.message || error.message || 'Unknown error'));
          this.isLoading = false;
        }
      });
    }
  }

  exportReport(): void {
    if (!this.batch) return;

    const report = this.generateReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `batch-${this.batch.batchNumber}-report-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    this.showSuccess('Report exported successfully');
  }

  private generateReport(): string {
    if (!this.batch) return '';

    return `
╔═══════════════════════════════════════════════════════════╗
║           VACCINE BATCH DETAILED REPORT                   ║
╚═══════════════════════════════════════════════════════════╝

Report Generated: ${new Date().toLocaleString()}
Generated By: ${this.currentUser?.username || 'Unknown'}
Facility: ${this.authService.getFacilityId()}

═══════════════════════════════════════════════════════════
BATCH IDENTIFICATION
═══════════════════════════════════════════════════════════

Vaccine Name:        ${this.batch.vaccineName}
Batch Number:        ${this.batch.batchNumber}
Manufacturer:        ${this.batch.manufacturer}

═══════════════════════════════════════════════════════════
QUANTITY INFORMATION
═══════════════════════════════════════════════════════════

Quantity Received:   ${this.batch.quantityReceived.toLocaleString()} doses
Quantity Remaining:  ${this.batch.quantityRemaining.toLocaleString()} doses
Stock Percentage:    ${this.getStockPercentage()}%
Stock Level:         ${this.getStockLevel()}

═══════════════════════════════════════════════════════════
DATE INFORMATION
═══════════════════════════════════════════════════════════

Receipt Date:        ${this.formatDate(this.batch.receiptDate)}
Expiry Date:         ${this.formatDate(this.batch.expiryDate)}
Days Until Expiry:   ${this.batch.daysUntilExpiry} days
Expiry Status:       ${this.getExpiryStatus()}

═══════════════════════════════════════════════════════════
STATUS INFORMATION
═══════════════════════════════════════════════════════════

Overall Status:      ${this.getStatusLabel()}
Is Expired:          ${this.batch.isExpired ? 'Yes' : 'No'}
Is Expiring Soon:    ${this.batch.isExpiringSoon ? 'Yes' : 'No'}

Status Description:
${this.getStatusDescription()}

═══════════════════════════════════════════════════════════
SYSTEM INFORMATION
═══════════════════════════════════════════════════════════

Batch ID:            ${this.batch.id}
Facility ID:         ${this.batch.facilityId}
Created At:          ${this.formatDateTime(this.batch.createdAt)}

═══════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════
    `.trim();
  }

  backToList(): void {
    this.router.navigate(['/inventory']);
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

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
