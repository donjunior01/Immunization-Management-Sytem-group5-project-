import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

// Interfaces
interface NotificationStats {
  total: number;
  unread: number;
  criticalAlerts: number;
  stockAlerts: number;
  systemNotifications: number;
  campaignUpdates: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

interface NotificationCategory {
  value: string;
  label: string;
  icon: string;
  count: number;
}

interface FilterOptions {
  type: string;
  category: string;
  priority: string;
  status: string;
  dateRange: string;
}

@Component({
  selector: 'app-notifications-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  templateUrl: './notifications-center.component.html',
  styleUrl: './notifications-center.component.scss'
})
export class NotificationsCenterComponent implements OnInit {
  // Stats
  stats: NotificationStats = {
    total: 0,
    unread: 0,
    criticalAlerts: 0,
    stockAlerts: 0,
    systemNotifications: 0,
    campaignUpdates: 0
  };

  // Data arrays
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  selectedNotifications: Set<string> = new Set();

  // Categories
  categories: NotificationCategory[] = [
    { value: 'all', label: 'All Notifications', icon: 'notifications', count: 0 },
    { value: 'stock', label: 'Stock Alerts', icon: 'inventory_2', count: 0 },
    { value: 'vaccine', label: 'Vaccine Alerts', icon: 'vaccines', count: 0 },
    { value: 'campaign', label: 'Campaign Updates', icon: 'campaign', count: 0 },
    { value: 'system', label: 'System Notifications', icon: 'info', count: 0 },
    { value: 'user', label: 'User Activity', icon: 'person', count: 0 }
  ];

  // Filters
  filters: FilterOptions = {
    type: 'all',
    category: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all'
  };

  // Filter options
  typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'alert', label: 'Alerts' },
    { value: 'notification', label: 'Notifications' },
    { value: 'update', label: 'Updates' },
    { value: 'reminder', label: 'Reminders' }
  ];

  priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' }
  ];

  dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  // Active tab
  activeTab: number = 0;

  // Selection
  allSelected: boolean = false;

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      this.loadStats();
      this.loadNotificationData();
      this.updateCategoryCounts();
      this.applyFilters();
    }, 1000);
  }

  loadStats(): void {
    this.stats = {
      total: 47,
      unread: 23,
      criticalAlerts: 5,
      stockAlerts: 12,
      systemNotifications: 8,
      campaignUpdates: 15
    };
  }

  loadNotificationData(): void {
    const now = new Date();
    this.notifications = [
      // Critical alerts
      {
        id: 'NOT001',
        title: 'Critical Stock Alert',
        message: 'DTP vaccine stock below minimum threshold (45 doses remaining)',
        type: 'alert',
        category: 'stock',
        priority: 'critical',
        timestamp: new Date(now.getTime() - 30 * 60000),
        read: false,
        actionUrl: '/inventory',
        metadata: { vaccine: 'DTP', quantity: 45 }
      },
      {
        id: 'NOT002',
        title: 'Vaccine Expiring Soon',
        message: 'BCG batch BCG-2024-002 expires in 5 days (280 doses)',
        type: 'alert',
        category: 'vaccine',
        priority: 'critical',
        timestamp: new Date(now.getTime() - 1 * 3600000),
        read: false,
        actionUrl: '/inventory/batches',
        metadata: { batch: 'BCG-2024-002', daysToExpiry: 5 }
      },
      {
        id: 'NOT003',
        title: 'System Maintenance Scheduled',
        message: 'System maintenance scheduled for tonight 2:00 AM - 4:00 AM',
        type: 'notification',
        category: 'system',
        priority: 'high',
        timestamp: new Date(now.getTime() - 2 * 3600000),
        read: false,
        metadata: { maintenanceTime: '2:00 AM - 4:00 AM' }
      },
      {
        id: 'NOT004',
        title: 'Cold Chain Alert',
        message: 'Refrigerator temperature deviation detected in storage unit A',
        type: 'alert',
        category: 'vaccine',
        priority: 'critical',
        timestamp: new Date(now.getTime() - 3 * 3600000),
        read: false,
        actionUrl: '/alerts',
        metadata: { unit: 'Storage A', temperature: 10.5 }
      },
      {
        id: 'NOT005',
        title: 'Stock Reorder Required',
        message: 'Measles vaccine needs reordering - current stock: 30 doses',
        type: 'alert',
        category: 'stock',
        priority: 'critical',
        timestamp: new Date(now.getTime() - 4 * 3600000),
        read: false,
        actionUrl: '/inventory/reorder',
        metadata: { vaccine: 'Measles', currentStock: 30 }
      },

      // High priority
      {
        id: 'NOT006',
        title: 'Campaign Target Update',
        message: 'BCG Newborn Campaign 2024 reached 49% completion (245/500)',
        type: 'update',
        category: 'campaign',
        priority: 'high',
        timestamp: new Date(now.getTime() - 5 * 3600000),
        read: false,
        actionUrl: '/campaigns/BCG-2024',
        metadata: { campaignName: 'BCG Newborn Campaign 2024', completion: 49 }
      },
      {
        id: 'NOT007',
        title: 'New User Registration',
        message: 'New health worker registered: Dr. Sarah Johnson',
        type: 'notification',
        category: 'user',
        priority: 'medium',
        timestamp: new Date(now.getTime() - 6 * 3600000),
        read: false,
        actionUrl: '/users',
        metadata: { userName: 'Dr. Sarah Johnson', role: 'HEALTH_WORKER' }
      },
      {
        id: 'NOT008',
        title: 'Stock Receipt Confirmation',
        message: 'New vaccine batch received: OPV-2024-003 (1000 doses)',
        type: 'notification',
        category: 'stock',
        priority: 'medium',
        timestamp: new Date(now.getTime() - 7 * 3600000),
        read: true,
        actionUrl: '/inventory/batches',
        metadata: { batch: 'OPV-2024-003', quantity: 1000 }
      },
      {
        id: 'NOT009',
        title: 'Vaccination Reminder',
        message: '15 patients due for DTP second dose this week',
        type: 'reminder',
        category: 'vaccine',
        priority: 'high',
        timestamp: new Date(now.getTime() - 8 * 3600000),
        read: true,
        actionUrl: '/patients/reminders',
        metadata: { vaccine: 'DTP', dueCount: 15 }
      },
      {
        id: 'NOT010',
        title: 'Campaign Starting Soon',
        message: 'Measles Outbreak Response campaign starts in 3 days',
        type: 'reminder',
        category: 'campaign',
        priority: 'high',
        timestamp: new Date(now.getTime() - 9 * 3600000),
        read: true,
        actionUrl: '/campaigns',
        metadata: { campaignName: 'Measles Outbreak Response', daysUntil: 3 }
      },

      // Medium priority
      {
        id: 'NOT011',
        title: 'Weekly Report Available',
        message: 'Your weekly vaccination report is now available for review',
        type: 'notification',
        category: 'system',
        priority: 'medium',
        timestamp: new Date(now.getTime() - 24 * 3600000),
        read: true,
        actionUrl: '/reports/weekly',
        metadata: { reportWeek: 'Week 49, 2024' }
      },
      {
        id: 'NOT012',
        title: 'Stock Level Normal',
        message: 'Hepatitis B vaccine stock replenished successfully (700 doses)',
        type: 'update',
        category: 'stock',
        priority: 'low',
        timestamp: new Date(now.getTime() - 36 * 3600000),
        read: true,
        actionUrl: '/inventory',
        metadata: { vaccine: 'Hepatitis B', quantity: 700 }
      },
      {
        id: 'NOT013',
        title: 'Campaign Completed',
        message: 'Q3 Routine Immunization campaign completed with 92.4% success',
        type: 'update',
        category: 'campaign',
        priority: 'medium',
        timestamp: new Date(now.getTime() - 48 * 3600000),
        read: true,
        actionUrl: '/campaigns/history',
        metadata: { campaignName: 'Q3 Routine Immunization', successRate: 92.4 }
      },
      {
        id: 'NOT014',
        title: 'System Update',
        message: 'New features added: Enhanced reporting and analytics dashboard',
        type: 'notification',
        category: 'system',
        priority: 'low',
        timestamp: new Date(now.getTime() - 72 * 3600000),
        read: true,
        metadata: { version: '2.5.0', features: ['Reporting', 'Analytics'] }
      },
      {
        id: 'NOT015',
        title: 'User Activity Alert',
        message: 'Unusual login activity detected from new location',
        type: 'alert',
        category: 'user',
        priority: 'high',
        timestamp: new Date(now.getTime() - 96 * 3600000),
        read: true,
        actionUrl: '/settings/security',
        metadata: { location: 'Mombasa', device: 'Mobile' }
      }
    ];
  }

  updateCategoryCounts(): void {
    this.categories.forEach(cat => {
      if (cat.value === 'all') {
        cat.count = this.notifications.length;
      } else {
        cat.count = this.notifications.filter(n => n.category === cat.value).length;
      }
    });
  }

  applyFilters(): void {
    this.loaderService.show(800);
    setTimeout(() => {
      let filtered = [...this.notifications];

      // Apply type filter
      if (this.filters.type !== 'all') {
        filtered = filtered.filter(n => n.type === this.filters.type);
      }

      // Apply category filter
      if (this.filters.category !== 'all') {
        filtered = filtered.filter(n => n.category === this.filters.category);
      }

      // Apply priority filter
      if (this.filters.priority !== 'all') {
        filtered = filtered.filter(n => n.priority === this.filters.priority);
      }

      // Apply status filter
      if (this.filters.status !== 'all') {
        const isUnread = this.filters.status === 'unread';
        filtered = filtered.filter(n => n.read !== isUnread);
      }

      // Apply date range filter
      if (this.filters.dateRange !== 'all') {
        const now = new Date();
        filtered = filtered.filter(n => {
          const notifDate = new Date(n.timestamp);
          switch (this.filters.dateRange) {
            case 'today':
              return notifDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
              return notifDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 3600000);
              return notifDate >= monthAgo;
            default:
              return true;
          }
        });
      }

      this.filteredNotifications = filtered;
      this.notificationService.success('Filters applied successfully');
    }, 800);
  }

  resetFilters(): void {
    this.filters = {
      type: 'all',
      category: 'all',
      priority: 'all',
      status: 'all',
      dateRange: 'all'
    };
    this.applyFilters();
  }

  filterByCategory(category: string): void {
    this.filters.category = category;
    this.applyFilters();
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      this.stats.unread--;
      this.notificationService.success('Notification marked as read');
    }
  }

  markAsUnread(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.read) {
      notification.read = false;
      this.stats.unread++;
      this.notificationService.success('Notification marked as unread');
    }
  }

  markAllAsRead(): void {
    this.loaderService.show(800);
    setTimeout(() => {
      this.notifications.forEach(n => n.read = true);
      this.stats.unread = 0;
      this.notificationService.success(`All ${this.notifications.length} notifications marked as read`);
    }, 800);
  }

  deleteNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (!notification.read) {
        this.stats.unread--;
      }
      this.notifications.splice(index, 1);
      this.stats.total--;
      this.updateCategoryCounts();
      this.applyFilters();
      this.notificationService.success('Notification deleted');
    }
  }

  toggleSelection(notificationId: string): void {
    if (this.selectedNotifications.has(notificationId)) {
      this.selectedNotifications.delete(notificationId);
    } else {
      this.selectedNotifications.add(notificationId);
    }
    this.updateAllSelected();
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedNotifications.clear();
    } else {
      this.filteredNotifications.forEach(n => this.selectedNotifications.add(n.id));
    }
    this.allSelected = !this.allSelected;
  }

  updateAllSelected(): void {
    this.allSelected = this.filteredNotifications.length > 0 &&
      this.filteredNotifications.every(n => this.selectedNotifications.has(n.id));
  }

  markSelectedAsRead(): void {
    if (this.selectedNotifications.size === 0) {
      this.notificationService.info('No notifications selected');
      return;
    }

    this.loaderService.show(800);
    setTimeout(() => {
      let count = 0;
      this.selectedNotifications.forEach(id => {
        const notification = this.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          this.stats.unread--;
          count++;
        }
      });
      this.selectedNotifications.clear();
      this.allSelected = false;
      this.notificationService.success(`${count} notification(s) marked as read`);
    }, 800);
  }

  deleteSelected(): void {
    if (this.selectedNotifications.size === 0) {
      this.notificationService.info('No notifications selected');
      return;
    }

    this.loaderService.show(800);
    setTimeout(() => {
      const selectedIds = Array.from(this.selectedNotifications);
      selectedIds.forEach(id => {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          const notification = this.notifications[index];
          if (!notification.read) {
            this.stats.unread--;
          }
          this.notifications.splice(index, 1);
          this.stats.total--;
        }
      });
      this.selectedNotifications.clear();
      this.allSelected = false;
      this.updateCategoryCounts();
      this.applyFilters();
      this.notificationService.success(`${selectedIds.length} notification(s) deleted`);
    }, 800);
  }

  viewNotification(notification: Notification): void {
    if (!notification.read) {
      this.markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      this.notificationService.info(`Navigating to ${notification.actionUrl}`);
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.icon : 'notifications';
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'alert': return 'type-alert';
      case 'notification': return 'type-notification';
      case 'update': return 'type-update';
      case 'reminder': return 'type-reminder';
      default: return '';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  refreshNotifications(): void {
    this.loadNotifications();
    this.notificationService.success('Notifications refreshed');
  }

  exportNotifications(format: string): void {
    this.loaderService.show(1000);
    setTimeout(() => {
      if (format === 'csv') this.generateCSV();
      else if (format === 'pdf') this.generatePDF();
    }, 1000);
  }

  generateCSV(): void {
    let csv = 'Notifications History - Immunization Database\n\n';
    csv += 'ID,Title,Message,Type,Category,Priority,Timestamp,Status\n';
    
    this.notifications.forEach(n => {
      const status = n.read ? 'Read' : 'Unread';
      csv += `${n.id},"${n.title}","${n.message}",${n.type},${n.category},${n.priority},${n.timestamp.toISOString()},${status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    this.notificationService.success('CSV exported successfully');
  }

  generatePDF(): void {
    this.notificationService.info('PDF generation would require additional library (e.g., jsPDF)');
  }
}
