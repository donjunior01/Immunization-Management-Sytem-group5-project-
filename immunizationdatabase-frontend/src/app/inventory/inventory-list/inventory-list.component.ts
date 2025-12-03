import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InventoryService, VaccineBatch } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AddBatchModalComponent } from '../add-batch/add-batch.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatDialogModule
  ],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  displayedColumns: string[] = [
    'vaccine_name',
    'batch_number',
    'manufacturer',
    'quantity',
    'expiry_date',
    'status',
    'actions'
  ];

  dataSource: MatTableDataSource<VaccineBatch>;
  loading = true;
  searchControl = new FormControl('');
  currentUser: any;
  userRole: string = '';
  sidenavOpened = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Thresholds for status determination
  private readonly CRITICAL_DAYS = 30;
  private readonly LOW_STOCK = 1000;
  private readonly MEDIUM_STOCK = 2000;

  constructor(
    private inventoryService: InventoryService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<VaccineBatch>([]);
  }

  ngOnInit(): void {
    this.loadUserData();
    this.checkScreenSize();
    this.loadInventory();
    this.setupSearch();
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

  loadInventory(): void {
    this.loading = true;
    this.inventoryService.getAllBatches().subscribe({
      next: (batches) => {
        this.dataSource.data = batches;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Custom filter predicate for better search
        this.dataSource.filterPredicate = (data: VaccineBatch, filter: string) => {
          const searchStr = filter.toLowerCase();
          return (
            (data.vaccine_name || '').toLowerCase().includes(searchStr) ||
            (data.batch_number || '').toLowerCase().includes(searchStr) ||
            (data.manufacturer || '').toLowerCase().includes(searchStr)
          );
        };

        this.loading = false;

        // Show success message if there's data
        if (batches.length > 0) {
          this.showSuccess(`Loaded ${batches.length} batch${batches.length !== 1 ? 'es' : ''} successfully`);
        }
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.showError('Failed to load inventory data. Please try again.');
        this.loading = false;
      }
    });
  }

  setupSearch(): void {
    this.searchControl.valueChanges.subscribe(value => {
      this.dataSource.filter = (value || '').trim().toLowerCase();

      // Reset to first page when filtering
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  navigateToAddBatch(): void {
    const dialogRef = this.dialog.open(AddBatchModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'custom-dialog-container',
      autoFocus: true,
      restoreFocus: true,
      hasBackdrop: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.showSuccess('Vaccine batch registered successfully!');
        this.loadInventory(); // Refresh the inventory list
      }
    });
  }

  viewBatch(batch: VaccineBatch): void {
    if (batch.id) {
      this.router.navigate(['/inventory/view', batch.id]);
    } else {
      this.showError('Invalid batch ID');
    }
  }

  // Status determination methods
  getStatusClass(batch: VaccineBatch): string {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiry_date);

    if (daysUntilExpiry < this.CRITICAL_DAYS) {
      return 'status-critical';
    }

    if (batch.quantity < this.LOW_STOCK) {
      return 'status-low';
    }

    if (batch.quantity < this.MEDIUM_STOCK) {
      return 'status-medium';
    }

    return 'status-good';
  }

  getStatusLabel(batch: VaccineBatch): string {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiry_date);

    if (daysUntilExpiry < this.CRITICAL_DAYS) {
      return 'Expiring Soon';
    }

    if (batch.quantity < this.LOW_STOCK) {
      return 'Low Stock';
    }

    if (batch.quantity < this.MEDIUM_STOCK) {
      return 'Medium Stock';
    }

    return 'Optimal';
  }

  getStatusIcon(batch: VaccineBatch): string {
    const daysUntilExpiry = this.calculateDaysUntilExpiry(batch.expiry_date);

    if (daysUntilExpiry < this.CRITICAL_DAYS) {
      return 'warning';
    }

    if (batch.quantity < this.LOW_STOCK) {
      return 'error';
    }

    if (batch.quantity < this.MEDIUM_STOCK) {
      return 'info';
    }

    return 'check_circle';
  }

  // Utility methods
  calculateDaysUntilExpiry(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Statistics methods
  getTotalDoses(): number {
    return this.dataSource.data.reduce((sum, batch) => sum + batch.quantity, 0);
  }

  getUniqueVaccineCount(): number {
    const uniqueVaccines = new Set(
      this.dataSource.data.map(batch => batch.vaccine_name)
    );
    return uniqueVaccines.size;
  }

  getExpiringSoonCount(): number {
    return this.dataSource.data.filter(batch =>
      this.calculateDaysUntilExpiry(batch.expiry_date) < this.CRITICAL_DAYS
    ).length;
  }

  // Notification methods
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

  // Action methods
  editBatch(batch: VaccineBatch, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showInfo('Edit functionality will be implemented in Sprint 2');
    // this.router.navigate(['/inventory/edit', batch.id]);
  }

  updateQuantity(batch: VaccineBatch, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showInfo('Quantity update will be implemented in Sprint 2');
  }

  deleteBatch(batch: VaccineBatch, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!batch.id) {
      this.showError('Invalid batch ID');
      return;
    }

    const batchNumber = batch.batch_number || 'Unknown';
    const confirmed = confirm(
      `Are you sure you want to delete batch ${batchNumber}?\n\n` +
      `This action cannot be undone and will permanently remove:\n` +
      `- ${batch.quantity} doses of ${batch.vaccine_name}\n` +
      `- All associated history and records`
    );

    if (confirmed) {
      this.inventoryService.deleteBatch(batch.id).subscribe({
        next: () => {
          this.showSuccess('Batch deleted successfully');
          this.loadInventory();
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Failed to delete batch. This feature is pending backend implementation.');
        }
      });
    }
  }

  exportData(): void {
    const data = this.dataSource.filteredData;
    const csv = this.convertToCSV(data);
    this.downloadCSV(csv, 'vaccine-inventory.csv');
    this.showSuccess('Inventory exported successfully!');
  }

  private convertToCSV(data: VaccineBatch[]): string {
    const headers = [
      'Vaccine Name',
      'Batch Number',
      'Manufacturer',
      'Quantity',
      'Expiry Date',
      'Days Until Expiry',
      'Status',
      'Storage Location',
      'Temperature',
      'Notes',
      'Created At'
    ];

    const rows = data.map(batch => [
      batch.vaccine_name || '',
      batch.batch_number || '',
      batch.manufacturer || '',
      batch.quantity || 0,
      this.formatDate(batch.expiry_date),
      this.calculateDaysUntilExpiry(batch.expiry_date),
      this.getStatusLabel(batch),
      batch.storage_location || 'N/A',
      batch.temperature ? `${batch.temperature}°C` : 'N/A',
      (batch.notes || '').replace(/,/g, ';'), // Replace commas to avoid CSV issues
      batch.created_at ? this.formatDate(batch.created_at) : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private downloadCSV(content: string, filename: string): void {
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

  refreshData(): void {
    this.showInfo('Refreshing inventory data...');
    this.loadInventory();
  }

  showFilters(): void {
    this.showInfo('Advanced filters will be implemented in Sprint 2');
  }

  // Handle window resize for responsive sidenav
  onWindowResize(): void {
    this.checkScreenSize();
  }
}