import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SyncQueueItem {
  id: number;
  userId: number;
  entityType: string;
  entityId: string;
  operationType: string;
  entityData: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface SyncStats {
  totalPending: number;
  totalSynced: number;
  totalFailed: number;
  lastSyncTime: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private apiUrl = `${environment.apiUrl}/sync`;

  constructor(private http: HttpClient) {}

  // Get all sync queue items for current user
  getAllSyncItems(): Observable<SyncQueueItem[]> {
    return this.http.get<SyncQueueItem[]>(`${this.apiUrl}/queue`);
  }

  // Get sync queue items by status
  getSyncItemsByStatus(status: string): Observable<SyncQueueItem[]> {
    return this.http.get<SyncQueueItem[]>(`${this.apiUrl}/queue/status/${status}`);
  }

  // Get pending sync items
  getPendingSyncItems(): Observable<SyncQueueItem[]> {
    return this.getSyncItemsByStatus('PENDING');
  }

  // Get failed sync items
  getFailedSyncItems(): Observable<SyncQueueItem[]> {
    return this.getSyncItemsByStatus('FAILED');
  }

  // Get sync statistics
  getSyncStats(): Observable<SyncStats> {
    return this.http.get<SyncStats>(`${this.apiUrl}/stats`);
  }

  // Retry a specific sync item
  retrySyncItem(itemId: number): Observable<SyncQueueItem> {
    return this.http.post<SyncQueueItem>(`${this.apiUrl}/retry/${itemId}`, {});
  }

  // Retry all failed items
  retryAllFailed(): Observable<{ message: string; retried: number }> {
    return this.http.post<{ message: string; retried: number }>(`${this.apiUrl}/retry-all`, {});
  }

  // Clear a specific sync item
  clearSyncItem(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/queue/${itemId}`);
  }

  // Clear all synced items
  clearAllSynced(): Observable<{ message: string; cleared: number }> {
    return this.http.delete<{ message: string; cleared: number }>(`${this.apiUrl}/queue/synced`);
  }

  // Clear all failed items
  clearAllFailed(): Observable<{ message: string; cleared: number }> {
    return this.http.delete<{ message: string; cleared: number }>(`${this.apiUrl}/queue/failed`);
  }

  // Force sync all pending items
  syncAll(): Observable<{ message: string; synced: number; failed: number }> {
    return this.http.post<{ message: string; synced: number; failed: number }>(`${this.apiUrl}/sync-all`, {});
  }

  // Get sync item details
  getSyncItemById(itemId: number): Observable<SyncQueueItem> {
    return this.http.get<SyncQueueItem>(`${this.apiUrl}/queue/${itemId}`);
  }

  // Helper methods for UI
  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'SYNCED': 'status-synced',
      'FAILED': 'status-failed'
    };
    return classes[status] || 'status-unknown';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': 'schedule',
      'SYNCED': 'check_circle',
      'FAILED': 'error'
    };
    return icons[status] || 'help';
  }

  getOperationTypeIcon(operationType: string): string {
    const icons: { [key: string]: string } = {
      'CREATE': 'add_circle',
      'UPDATE': 'edit',
      'DELETE': 'delete'
    };
    return icons[operationType] || 'sync';
  }

  formatEntityType(entityType: string): string {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
