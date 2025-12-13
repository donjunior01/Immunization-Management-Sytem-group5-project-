import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  userId: string;
  role: string;
  action: string;
  category: string;
  entity: string;
  entityId: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  uniqueUsers: number;
  criticalActions: number;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss'
})
export class ActivityLogComponent implements OnInit {
  activities: ActivityLog[] = [];
  filteredActivities: ActivityLog[] = [];
  displayedActivities: ActivityLog[] = [];
  selectedActivity: ActivityLog | null = null;
  
  stats: ActivityStats = {
    totalActivities: 0,
    todayActivities: 0,
    uniqueUsers: 0,
    criticalActions: 0
  };
  
  // Filters
  filters = {
    search: '',
    category: 'all',
    action: 'all',
    user: 'all',
    status: 'all',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  };
  
  // Pagination
  pageSize: number = 20;
  pageIndex: number = 0;
  totalItems: number = 0;
  
  // Options
  categoryOptions = [
    { value: 'all', label: 'All Categories', icon: 'category' },
    { value: 'authentication', label: 'Authentication', icon: 'login' },
    { value: 'patient', label: 'Patient Management', icon: 'person' },
    { value: 'vaccination', label: 'Vaccination', icon: 'vaccines' },
    { value: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { value: 'campaign', label: 'Campaign', icon: 'campaign' },
    { value: 'user', label: 'User Management', icon: 'manage_accounts' },
    { value: 'settings', label: 'Settings', icon: 'settings' },
    { value: 'report', label: 'Reports', icon: 'assessment' }
  ];
  
  actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'read', label: 'Read' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' }
  ];
  
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failure', label: 'Failure' },
    { value: 'warning', label: 'Warning' }
  ];
  
  displayedColumns: string[] = ['timestamp', 'user', 'action', 'entity', 'status', 'actions'];
  showDetailDialog: boolean = false;

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadActivityLog();
  }

  loadActivityLog(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.generateMockData();
      this.calculateStats();
      this.applyFilters();
    }, 1000);
  }

  generateMockData(): void {
    const users = [
      { name: 'Facility Manager', id: 'FM001', role: 'Facility Manager' },
      { name: 'Health Worker', id: 'HW001', role: 'Health Worker' },
      { name: 'John Doe', id: 'FM002', role: 'Facility Manager' },
      { name: 'Jane Smith', id: 'HW002', role: 'Health Worker' }
    ];
    
    const categories = ['authentication', 'patient', 'vaccination', 'inventory', 'campaign', 'user', 'settings', 'report'];
    const actions = ['create', 'read', 'update', 'delete', 'login', 'logout', 'export'];
    const statuses = ['success', 'failure', 'warning'];
    
    this.activities = [];
    
    // Generate 100 activity logs
    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const status = Math.random() > 0.1 ? 'success' : (Math.random() > 0.5 ? 'failure' : 'warning');
      const hoursAgo = Math.floor(Math.random() * 168); // Last 7 days
      
      const activity: ActivityLog = {
        id: `ACT${String(i + 1).padStart(5, '0')}`,
        timestamp: new Date(Date.now() - hoursAgo * 3600000),
        user: user.name,
        userId: user.id,
        role: user.role,
        action: action,
        category: category,
        entity: this.getEntityName(category),
        entityId: `ENT${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
        description: this.generateDescription(action, category),
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        status: status
      };
      
      // Add changes for update actions
      if (action === 'update') {
        activity.changes = this.generateChanges(category);
      }
      
      this.activities.push(activity);
    }
    
    // Sort by timestamp (newest first)
    this.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getEntityName(category: string): string {
    const entities: { [key: string]: string } = {
      'authentication': 'User Session',
      'patient': 'Patient Record',
      'vaccination': 'Vaccination Record',
      'inventory': 'Vaccine Batch',
      'campaign': 'Campaign',
      'user': 'User Account',
      'settings': 'System Settings',
      'report': 'Report'
    };
    return entities[category] || 'Entity';
  }

  generateDescription(action: string, category: string): string {
    const descriptions: { [key: string]: string[] } = {
      'create': [
        'Created new patient record',
        'Added new vaccine batch to inventory',
        'Started new vaccination campaign',
        'Registered new user account'
      ],
      'update': [
        'Updated patient information',
        'Modified vaccine batch quantity',
        'Updated campaign targets',
        'Changed user permissions'
      ],
      'delete': [
        'Deleted patient record',
        'Removed expired vaccine batch',
        'Cancelled campaign',
        'Deactivated user account'
      ],
      'login': ['Successful login', 'User logged in'],
      'logout': ['User logged out', 'Session ended'],
      'export': ['Exported data to CSV', 'Generated PDF report']
    };
    
    const actionDescriptions = descriptions[action] || ['Performed action'];
    return actionDescriptions[Math.floor(Math.random() * actionDescriptions.length)];
  }

  generateChanges(category: string): any[] {
    const changes: { [key: string]: any[] } = {
      'patient': [
        { field: 'Phone Number', oldValue: '0712345678', newValue: '0712345679' },
        { field: 'Address', oldValue: '123 Old Street', newValue: '456 New Avenue' }
      ],
      'inventory': [
        { field: 'Quantity Remaining', oldValue: '150', newValue: '120' },
        { field: 'Status', oldValue: 'Active', newValue: 'Low Stock' }
      ],
      'campaign': [
        { field: 'Target Population', oldValue: '500', newValue: '600' },
        { field: 'End Date', oldValue: '2025-01-31', newValue: '2025-02-15' }
      ],
      'user': [
        { field: 'Role', oldValue: 'Health Worker', newValue: 'Facility Manager' },
        { field: 'Status', oldValue: 'Inactive', newValue: 'Active' }
      ]
    };
    
    return changes[category] || [];
  }

  calculateStats(): void {
    this.stats.totalActivities = this.activities.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.stats.todayActivities = this.activities.filter(a => {
      const activityDate = new Date(a.timestamp);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === today.getTime();
    }).length;
    
    const uniqueUserIds = new Set(this.activities.map(a => a.userId));
    this.stats.uniqueUsers = uniqueUserIds.size;
    
    this.stats.criticalActions = this.activities.filter(a => 
      a.action === 'delete' || a.status === 'failure'
    ).length;
  }

  applyFilters(): void {
    this.loaderService.show(800);
    
    setTimeout(() => {
      this.filteredActivities = this.activities.filter(activity => {
        // Search filter
        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          const matchesSearch = 
            activity.user.toLowerCase().includes(searchLower) ||
            activity.description.toLowerCase().includes(searchLower) ||
            activity.entity.toLowerCase().includes(searchLower) ||
            activity.entityId.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;
        }
        
        // Category filter
        if (this.filters.category !== 'all' && activity.category !== this.filters.category) {
          return false;
        }
        
        // Action filter
        if (this.filters.action !== 'all' && activity.action !== this.filters.action) {
          return false;
        }
        
        // Status filter
        if (this.filters.status !== 'all' && activity.status !== this.filters.status) {
          return false;
        }
        
        // Date range filter
        if (this.filters.dateFrom) {
          const dateFrom = new Date(this.filters.dateFrom);
          dateFrom.setHours(0, 0, 0, 0);
          if (activity.timestamp < dateFrom) return false;
        }
        
        if (this.filters.dateTo) {
          const dateTo = new Date(this.filters.dateTo);
          dateTo.setHours(23, 59, 59, 999);
          if (activity.timestamp > dateTo) return false;
        }
        
        return true;
      });
      
      this.totalItems = this.filteredActivities.length;
      this.pageIndex = 0;
      this.updateDisplayedActivities();
      this.notificationService.success('Filters applied successfully');
    }, 800);
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      category: 'all',
      action: 'all',
      user: 'all',
      status: 'all',
      dateFrom: null,
      dateTo: null
    };
    this.applyFilters();
  }

  updateDisplayedActivities(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedActivities = this.filteredActivities.slice(startIndex, endIndex);
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updateDisplayedActivities();
  }

  viewDetails(activity: ActivityLog): void {
    this.selectedActivity = activity;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedActivity = null;
  }

  exportLogs(format: string): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      if (format === 'csv') {
        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-log-${new Date().getTime()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Activity log exported to CSV');
      } else if (format === 'json') {
        const json = JSON.stringify(this.filteredActivities, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activity-log-${new Date().getTime()}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Activity log exported to JSON');
      } else {
        this.notificationService.info('PDF export would require additional library (e.g., jsPDF)');
      }
    }, 1000);
  }

  generateCSV(): string {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Entity', 'Entity ID', 'Description', 'Status', 'IP Address'];
    const rows = this.filteredActivities.map(activity => [
      activity.timestamp.toISOString(),
      activity.user,
      activity.role,
      activity.action,
      activity.category,
      activity.entity,
      activity.entityId,
      activity.description,
      activity.status,
      activity.ipAddress
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  refreshLog(): void {
    this.loadActivityLog();
    this.notificationService.success('Activity log refreshed');
  }

  getCategoryIcon(category: string): string {
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option ? option.icon : 'category';
  }

  getActionClass(action: string): string {
    return `action-${action}`;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleString();
  }

  formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
