import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { InventoryRealService, VaccineBatchResponse } from '../../services/inventory-real.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  displayedColumns: string[] = [
    'batchNumber',
    'vaccineName',
    'manufacturer',
    'stock',
    'expiryDate',
    'status',
    'actions'
  ];

  dataSource: MatTableDataSource<VaccineBatchResponse>;
  isLoading = false;

  // Filters
  vaccineNameControl = new FormControl('all');
  statusControl = new FormControl('all');
  searchControl = new FormControl('');

  // Filter options
  vaccineTypes = [
    'All',
    'BCG',
    'Polio',
    'DTP',
    'Hepatitis B',
    'Measles',
    'Rotavirus',
    'Pneumococcal'
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' }
  ];

  allBatches: VaccineBatchResponse[] = [];
  currentUser: any;
  userRole: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private inventoryService: InventoryRealService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.dataSource = new MatTableDataSource<VaccineBatchResponse>();
  }

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.loadUserData();
    this.loadInventory();
    this.setupFilters();
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

  loadInventory(): void {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login...');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.isLoading = true;

    // Use authService.getFacilityId() which handles all user types correctly
    const facilityId = this.authService.getFacilityId();

    if (facilityId === 'NATIONAL') {
      // For government officials, they can view national dashboard for inventory summary
      // Inventory list is facility-specific
      this.notificationService.info('Inventory is facility-specific. View national summary on dashboard or select a facility.');
      this.isLoading = false;
      return;
    }

    this.inventoryService.getBatchesByFacility(facilityId).subscribe({
      next: (batches) => {
        this.allBatches = batches;
        this.dataSource.data = batches;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
        this.notificationService.success(`Loaded ${batches.length} vaccine batches`);
      },
      error: (error) => {
        console.error('Error loading inventory:', error);

        if (error.status === 403 || error.status === 401) {
          this.notificationService.error('Authentication required. Please log in.');
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else {
          this.notificationService.error('Failed to load inventory data');
        }
        this.isLoading = false;
      }
    });
  }

  setupFilters(): void {
    // Subscribe to all filter changes
    this.vaccineNameControl.valueChanges.subscribe(() => this.applyFilters());
    this.statusControl.valueChanges.subscribe(() => this.applyFilters());
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    let filteredBatches = [...this.allBatches];

    // Filter by vaccine name
    const selectedVaccine = this.vaccineNameControl.value;
    if (selectedVaccine && selectedVaccine !== 'all') {
      filteredBatches = filteredBatches.filter(
        batch => batch.vaccineName.toLowerCase() === selectedVaccine.toLowerCase()
      );
    }

    // Filter by status
    const selectedStatus = this.statusControl.value;
    if (selectedStatus && selectedStatus !== 'all') {
      filteredBatches = filteredBatches.filter(batch => {
        switch (selectedStatus) {
          case 'available':
            return !batch.isExpired && !batch.isExpiringSoon && batch.quantityRemaining > 0;
          case 'expiring':
            return batch.isExpiringSoon && !batch.isExpired;
          case 'expired':
            return batch.isExpired;
          case 'low-stock':
            return batch.quantityRemaining > 0 && batch.quantityRemaining <= 10;
          case 'out-of-stock':
            return batch.quantityRemaining === 0;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filteredBatches = filteredBatches.filter(batch =>
        batch.vaccineName.toLowerCase().includes(searchTerm) ||
        batch.batchNumber.toLowerCase().includes(searchTerm) ||
        batch.manufacturer.toLowerCase().includes(searchTerm)
      );
    }

    this.dataSource.data = filteredBatches;
  }

  getStatusColor(batch: VaccineBatchResponse): string {
    if (batch.isExpired) return 'warn';
    if (batch.isExpiringSoon) return 'accent';
    if (batch.quantityRemaining === 0) return 'warn';
    if (batch.quantityRemaining <= 10) return 'accent';
    return 'primary';
  }

  getStatusLabel(batch: VaccineBatchResponse): string {
    if (batch.isExpired) return 'Expired';
    if (batch.isExpiringSoon) return `Expiring (${batch.daysUntilExpiry}d)`;
    if (batch.quantityRemaining === 0) return 'Out of Stock';
    if (batch.quantityRemaining <= 10) return 'Low Stock';
    return 'Available';
  }

  getStatusIcon(batch: VaccineBatchResponse): string {
    if (batch.isExpired) return 'dangerous';
    if (batch.isExpiringSoon) return 'warning';
    if (batch.quantityRemaining === 0) return 'inventory_2';
    if (batch.quantityRemaining <= 10) return 'trending_down';
    return 'check_circle';
  }

  getStockPercentage(batch: VaccineBatchResponse): number {
    if (batch.quantityReceived === 0) return 0;
    return Math.round((batch.quantityRemaining / batch.quantityReceived) * 100);
  }

  viewBatchDetails(batch: VaccineBatchResponse): void {
    this.router.navigate(['/inventory/view', batch.id]);
  }

  addNewBatch(): void {
    this.router.navigate(['/inventory/add-batch']);
  }

  editBatch(batch: VaccineBatchResponse, event?: Event): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/inventory/add-batch'], {
      queryParams: { batchId: batch.id }
    });
  }

  deleteBatch(batch: VaccineBatchResponse, event?: Event): void {
    if (event) event.stopPropagation();

    const confirmed = confirm(
      `Are you sure you want to delete batch ${batch.batchNumber}?\n` +
      `Vaccine: ${batch.vaccineName}\n` +
      `Remaining: ${batch.quantityRemaining} doses\n\n` +
      `This action cannot be undone.`
    );

    if (confirmed) {
      this.isLoading = true;
      this.inventoryService.deleteBatch(batch.id).subscribe({
        next: () => {
          this.showSuccess('Batch deleted successfully');
          this.loadInventory(); // Reload the list
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.showError('Failed to delete batch. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  exportToCSV(): void {
    const csvData = this.dataSource.data.map(batch => ({
      'Batch Number': batch.batchNumber,
      'Vaccine Name': batch.vaccineName,
      'Manufacturer': batch.manufacturer,
      'Quantity Received': batch.quantityReceived,
      'Quantity Remaining': batch.quantityRemaining,
      'Stock %': this.getStockPercentage(batch),
      'Expiry Date': this.formatDate(batch.expiryDate),
      'Receipt Date': this.formatDate(batch.receiptDate),
      'Days Until Expiry': batch.daysUntilExpiry,
      'Status': this.getStatusLabel(batch),
      'Is Expired': batch.isExpired ? 'Yes' : 'No',
      'Is Expiring Soon': batch.isExpiringSoon ? 'Yes' : 'No'
    }));

    const csv = this.convertToCSV(csvData);
    this.downloadCSV(csv, 'vaccine-inventory.csv');
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getTotalDoses(): number {
    return this.allBatches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
  }

  getUniqueVaccineCount(): number {
    const uniqueVaccines = new Set(this.allBatches.map(b => b.vaccineName));
    return uniqueVaccines.size;
  }

  getExpiringSoonCount(): number {
    return this.allBatches.filter(b => b.isExpiringSoon && !b.isExpired).length;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
