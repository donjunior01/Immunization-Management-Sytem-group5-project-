import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
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

interface StockLevelSummary {
  vaccineName: string;
  totalQuantity: number;
  batchCount: number;
  lowStockBatches: number;
  expiringBatches: number;
  status: 'optimal' | 'adequate' | 'low' | 'critical';
  earliestExpiry: string | null;
}

@Component({
  selector: 'app-stock-level',
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
  templateUrl: './stock-level.component.html',
  styleUrls: ['./stock-level.component.scss']
})
export class StockLevelComponent implements OnInit {
  displayedColumns = ['vaccineName', 'totalQuantity', 'batchCount', 'status', 'lowStock', 'expiringSoon', 'actions'];
  dataSource!: MatTableDataSource<StockLevelSummary>;
  filterForm!: FormGroup;
  isLoading = false;
  currentUser: any;
  userRole: string = '';
  facilityId: string | null = null;

  // Stock thresholds
  readonly OPTIMAL_THRESHOLD = 1000;
  readonly ADEQUATE_THRESHOLD = 500;
  readonly LOW_THRESHOLD = 200;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Stats cards
  totalVaccines = 0;
  criticalStockCount = 0;
  lowStockCount = 0;
  expiringCount = 0;

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryRealService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.dataSource = new MatTableDataSource<StockLevelSummary>();
  }

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.loadUserData();
    this.initializeFilterForm();
    this.loadStockLevels();
  }

  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.userRole = this.formatUserRole(user.role || 'Health Worker');
      this.facilityId = this.authService.getFacilityId();
    }
  }

  formatUserRole(role: string): string {
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      statusFilter: ['all']
    });

    // Setup filter listeners
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadStockLevels(): void {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.warn('User not authenticated, redirecting to login...');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.isLoading = true;

    this.inventoryService.getBatches().subscribe({
      next: (batches) => {
        const stockLevels = this.calculateStockLevels(batches);
        this.dataSource.data = stockLevels;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        this.calculateStats(stockLevels);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stock levels:', error);

        // If the user is unauthenticated, force logout and redirect to login.
        if (error.status === 401) {
          this.notificationService.error('Authentication required. Please log in.');
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        } else if (error.status === 403) {
          // Forbidden: user doesn't have permission to view this resource.
          // Do not log the user out; show a non-blocking warning and keep the page usable.
          this.notificationService.warn('Access denied: you do not have permission to view stock levels.');
          this.dataSource.data = [];
        } else {
          this.notificationService.error('Failed to load stock level data');
        }

        this.isLoading = false;
      }
    });
  }

  calculateStockLevels(batches: VaccineBatchResponse[]): StockLevelSummary[] {
    const vaccineGroups = new Map<string, VaccineBatchResponse[]>();

    // Group batches by vaccine name
    batches.forEach(batch => {
      if (!vaccineGroups.has(batch.vaccineName)) {
        vaccineGroups.set(batch.vaccineName, []);
      }
      vaccineGroups.get(batch.vaccineName)!.push(batch);
    });

    // Calculate stock levels for each vaccine
    return Array.from(vaccineGroups.entries()).map(([vaccineName, vaccineBatches]) => {
      const totalQuantity = vaccineBatches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
      const batchCount = vaccineBatches.length;
      const lowStockBatches = vaccineBatches.filter(b => b.quantityRemaining < 100).length;

      // Calculate expiring batches (within 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expiringBatches = vaccineBatches.filter(b =>
        new Date(b.expiryDate) <= thirtyDaysFromNow && new Date(b.expiryDate) >= today
      ).length;

      // Find earliest expiry
      const earliestExpiry = vaccineBatches.reduce((earliest, batch) => {
        const batchDate = new Date(batch.expiryDate);
        return !earliest || batchDate < new Date(earliest) ? batch.expiryDate : earliest;
      }, vaccineBatches[0]?.expiryDate || null);

      // Determine overall status
      let status: 'optimal' | 'adequate' | 'low' | 'critical';
      if (totalQuantity >= this.OPTIMAL_THRESHOLD) {
        status = 'optimal';
      } else if (totalQuantity >= this.ADEQUATE_THRESHOLD) {
        status = 'adequate';
      } else if (totalQuantity >= this.LOW_THRESHOLD) {
        status = 'low';
      } else {
        status = 'critical';
      }

      return {
        vaccineName,
        totalQuantity,
        batchCount,
        lowStockBatches,
        expiringBatches,
        status,
        earliestExpiry
      };
    });
  }

  calculateStats(stockLevels: StockLevelSummary[]): void {
    this.totalVaccines = stockLevels.length;
    this.criticalStockCount = stockLevels.filter(s => s.status === 'critical').length;
    this.lowStockCount = stockLevels.filter(s => s.status === 'low').length;
    this.expiringCount = stockLevels.reduce((sum, s) => sum + s.expiringBatches, 0);
  }

  applyFilters(): void {
    const searchTerm = this.filterForm.get('searchTerm')?.value?.toLowerCase() || '';
    const statusFilter = this.filterForm.get('statusFilter')?.value || 'all';

    this.dataSource.filterPredicate = (data: StockLevelSummary, filter: string) => {
      const matchesSearch = data.vaccineName.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || data.status === statusFilter;
      return matchesSearch && matchesStatus;
    };

    this.dataSource.filter = Math.random().toString(); // Trigger filter
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'optimal': 'primary',
      'adequate': 'accent',
      'low': 'warn',
      'critical': 'warn'
    };
    return colors[status] || 'basic';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'optimal': 'check_circle',
      'adequate': 'info',
      'low': 'warning',
      'critical': 'error'
    };
    return icons[status] || 'help';
  }

  viewDetails(stock: StockLevelSummary): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      // Navigate to inventory list with vaccine filter
      this.router.navigate(['/inventory'], {
        queryParams: { vaccine: stock.vaccineName }
      });
    }, 1000);
  }

  addBatch(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.router.navigate(['/inventory/add-batch']);
    }, 1000);
  }

  refresh(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.loadStockLevels();
      this.notificationService.success('Stock levels refreshed successfully');
    }, 1000);
  }

  exportData(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      const data = this.dataSource.filteredData;
      const csvContent = this.convertToCSV(data);
      this.downloadCSV(csvContent, 'stock-levels.csv');
      this.notificationService.success('Stock levels exported successfully');
    }, 1000);
  }

  private convertToCSV(data: StockLevelSummary[]): string {
    const headers = ['Vaccine Name', 'Total Quantity', 'Batch Count', 'Status', 'Low Stock Batches', 'Expiring Batches', 'Earliest Expiry'];
    const rows = data.map(item => [
      item.vaccineName,
      item.totalQuantity,
      item.batchCount,
      item.status.toUpperCase(),
      item.lowStockBatches,
      item.expiringBatches,
      item.earliestExpiry || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
