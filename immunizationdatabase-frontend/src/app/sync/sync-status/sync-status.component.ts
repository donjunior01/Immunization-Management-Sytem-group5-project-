import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SyncService, SyncQueueItem, SyncStats } from '../../services/sync.service';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss']
})
export class SyncStatusComponent implements OnInit {
  displayedColumns: string[] = ['entityType', 'operationType', 'status', 'createdAt', 'retryCount', 'actions'];
  dataSource: MatTableDataSource<SyncQueueItem>;
  filterForm: FormGroup;
  isLoading = false;
  syncStats: SyncStats = {
    totalPending: 0,
    totalSynced: 0,
    totalFailed: 0,
    lastSyncTime: null
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private syncService: SyncService,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<SyncQueueItem>([]);
    this.filterForm = this.fb.group({
      statusFilter: ['all']
    });
  }

  ngOnInit(): void {
    this.loaderService.show();
    this.loadSyncData();
    this.loadStats();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupFilters(): void {
    this.filterForm.get('statusFilter')?.valueChanges.subscribe(value => {
      this.applyFilters();
    });
  }

  loadSyncData(): void {
    this.isLoading = true;
    this.syncService.getAllSyncItems().subscribe({
      next: (items) => {
        this.dataSource.data = items;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading sync data:', error);
        if (error.status === 401) {
          this.notificationService.error('Authentication required. Please log in.');
          // Optionally force logout and redirect if auth expired
          // (Keep behavior consistent with other components)
          // Note: sync data is non-critical, so avoid aggressive navigation when possible.
          this.isLoading = false;
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        } else if (error.status === 403) {
          this.notificationService.warn('Access denied: you do not have permission to view sync data.');
          this.dataSource.data = [];
          this.isLoading = false;
        } else {
          this.notificationService.error('Failed to load sync data');
          this.isLoading = false;
        }
      }
    });
  }

  loadStats(): void {
    this.syncService.getSyncStats().subscribe({
      next: (stats) => {
        this.syncStats = stats;
      },
      error: (error) => {
        console.error('Error loading sync stats:', error);
      }
    });
  }

  applyFilters(): void {
    const statusFilter = this.filterForm.get('statusFilter')?.value;

    if (statusFilter === 'all') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (data: SyncQueueItem) => {
        return data.syncStatus === statusFilter;
      };
      this.dataSource.filter = statusFilter;
    }
  }

  refresh(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loadSyncData();
      this.loadStats();
      this.notificationService.success('Sync data refreshed');
    }, 1000);
  }

  syncAll(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.syncService.syncAll().subscribe({
        next: (result) => {
          this.notificationService.success(
            `Sync completed: ${result.synced} synced, ${result.failed} failed`
          );
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error syncing all:', error);
          this.notificationService.error('Failed to sync all items');
        }
      });
    }, 1000);
  }

  retryItem(item: SyncQueueItem): void {
    this.loaderService.show();
    setTimeout(() => {
      this.syncService.retrySyncItem(item.id).subscribe({
        next: () => {
          this.notificationService.success('Retry initiated');
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error retrying item:', error);
          this.notificationService.error('Failed to retry item');
        }
      });
    }, 1000);
  }

  retryAllFailed(): void {
    if (!confirm('Are you sure you want to retry all failed sync items?')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.syncService.retryAllFailed().subscribe({
        next: (result) => {
          this.notificationService.success(`Retried ${result.retried} failed items`);
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error retrying all failed:', error);
          this.notificationService.error('Failed to retry all items');
        }
      });
    }, 1000);
  }

  deleteItem(item: SyncQueueItem): void {
    if (!confirm(`Are you sure you want to delete this ${item.entityType} sync item?`)) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.syncService.clearSyncItem(item.id).subscribe({
        next: () => {
          this.notificationService.success('Sync item deleted');
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          this.notificationService.error('Failed to delete sync item');
        }
      });
    }, 1000);
  }

  clearAllSynced(): void {
    if (!confirm('Are you sure you want to clear all synced items? This action cannot be undone.')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.syncService.clearAllSynced().subscribe({
        next: (result) => {
          this.notificationService.success(`Cleared ${result.cleared} synced items`);
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error clearing synced items:', error);
          this.notificationService.error('Failed to clear synced items');
        }
      });
    }, 1000);
  }

  clearAllFailed(): void {
    if (!confirm('Are you sure you want to clear all failed items? This action cannot be undone.')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.syncService.clearAllFailed().subscribe({
        next: (result) => {
          this.notificationService.success(`Cleared ${result.cleared} failed items`);
          this.loadSyncData();
          this.loadStats();
        },
        error: (error) => {
          console.error('Error clearing failed items:', error);
          this.notificationService.error('Failed to clear failed items');
        }
      });
    }, 1000);
  }

  viewDetails(item: SyncQueueItem): void {
    this.notificationService.info(`Entity Data: ${item.entityData || 'No data available'}`);
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusIcon(status: string): string {
    return this.syncService.getStatusIcon(status);
  }

  getOperationIcon(operation: string): string {
    return this.syncService.getOperationTypeIcon(operation);
  }

  formatEntityType(entityType: string): string {
    return this.syncService.formatEntityType(entityType);
  }

  exportData(): void {
    this.loaderService.show();
    setTimeout(() => {
      const data = this.dataSource.data;
      const csv = this.convertToCSV(data);
      this.downloadCSV(csv, `sync-status-${new Date().toISOString().split('T')[0]}.csv`);
      this.notificationService.success('Sync data exported successfully');
    }, 1000);
  }

  private convertToCSV(data: SyncQueueItem[]): string {
    const headers = ['ID', 'Entity Type', 'Operation', 'Status', 'Created At', 'Retry Count', 'Error Message'];
    const rows = data.map(item => [
      item.id,
      this.formatEntityType(item.entityType),
      item.operationType,
      item.syncStatus,
      this.formatDate(item.createdAt),
      item.retryCount,
      item.errorMessage || 'N/A'
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
