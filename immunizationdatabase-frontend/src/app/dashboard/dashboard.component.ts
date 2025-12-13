import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../services/auth.service';
import { InventoryService } from '../services/inventory.service';
import { AddBatchModalComponent } from '../inventory/add-batch/add-batch.component';
import { StatisticsService, NationalStatistics } from '../services/statistics.service';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { LogoutConfirmationComponent } from '../shared/logout-confirmation/logout-confirmation.component';

interface StockLevel {
  vaccineName: string;
  quantity: number;
  status: 'optimal' | 'adequate' | 'low' | 'critical';
  expiryDays: number;
  batchCount: number;
  manufacturer?: string;
  lastUpdated?: Date;
}

interface QuickStat {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  gradient: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  isAlert?: boolean;
  action?: string;
  buttonText?: string;
  clickable?: boolean;
}

interface RecentActivity {
  action: string;
  vaccine: string;
  user: string;
  time: string;
  icon: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  userRole: string = '';
  facilityId: string = '';
  isGovernmentOfficial: boolean = false;
  currentDate = new Date();
  loading = true;
  sidenavOpened = true;
  nationalStats: NationalStatistics | null = null;

  quickStats: QuickStat[] = [
    {
      title: 'Active Vaccine Types',
      value: 0,
      icon: 'medication',
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
      subtitle: 'In inventory'
    },
    {
      title: 'Total Doses Available',
      value: 0,
      icon: 'inventory_2',
      color: '#388e3c',
      gradient: 'linear-gradient(135deg, #388e3c 0%, #81c784 100%)',
      subtitle: 'Ready for administration'
    },
    {
      title: 'Stock Alerts',
      value: 0,
      icon: 'notifications_active',
      color: '#f57c00',
      gradient: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
      subtitle: 'Require attention',
      isAlert: true
    },
    {
      title: 'Expiring Soon',
      value: 0,
      icon: 'event_busy',
      color: '#d32f2f',
      gradient: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
      trend: 'Next 30 days',
      subtitle: 'Action required',
      isAlert: true
    }
  ];

  healthWorkerCards: QuickStat[] = [
    {
      title: 'Patient Records',
      value: 0,
      icon: 'person',
      color: '#0066CC',
      gradient: 'linear-gradient(135deg, #0066CC 0%, #338FD8 100%)',
      subtitle: 'Total registered patients',
      action: 'view-patients',
      clickable: true
    },
    {
      title: 'Print Cards',
      value: 'Generate',
      icon: 'print',
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      subtitle: 'Vaccination cards',
      action: 'print-cards',
      clickable: true
    },
    {
      title: 'Defaulters',
      value: 0,
      icon: 'warning',
      color: '#FFA500',
      gradient: 'linear-gradient(135deg, #FFA500 0%, #FFB732 100%)',
      subtitle: 'Missed vaccinations',
      isAlert: true,
      action: 'view-defaulters',
      clickable: true
    },
    {
      title: 'Low Stock Alert',
      value: 0,
      icon: 'inventory',
      color: '#DC3545',
      gradient: 'linear-gradient(135deg, #DC3545 0%, #E15665 100%)',
      subtitle: 'Items below threshold',
      isAlert: true,
      action: 'manage-stock',
      buttonText: 'Manage Low Stock',
      clickable: true
    }
  ];

  stockLevels: StockLevel[] = [];
  recentActivities: RecentActivity[] = [];

  readonly OPTIMAL_THRESHOLD = 5000;
  readonly ADEQUATE_THRESHOLD = 2000;
  readonly LOW_THRESHOLD = 1000;

  constructor(
    private authService: AuthService,
    private inventoryService: InventoryService,
    private statisticsService: StatisticsService,
    private router: Router,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.loadUserData();
    this.loadDashboardData();
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    if (window.innerWidth < 1024) {
      this.sidenavOpened = false;
    }
  }

  loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.userRole = this.formatUserRole(user.role || 'Health Worker');
      this.facilityId = this.authService.getFacilityId();
      this.isGovernmentOfficial = this.authService.isGovernmentOfficial();
      
      console.log('User Data Loaded:', {
        username: user.username,
        role: user.role,
        facilityId: this.facilityId,
        isGovernmentOfficial: this.isGovernmentOfficial
      });
    }
  }

  loadDashboardData(): void {
    this.loading = true;

    // Government officials see national statistics
    if (this.isGovernmentOfficial) {
      this.loadNationalDashboard();
    } else {
      // Facility managers and health workers see facility-specific data
      this.loadFacilityDashboard();
    }
  }

  /**
   * Load national-level dashboard for government officials
   */
  loadNationalDashboard(): void {
    console.log('Loading national dashboard data...');
    
    // Try to get real national statistics from the backend
    this.statisticsService.getNationalStatistics().subscribe({
      next: (stats) => {
        this.nationalStats = stats;
        this.updateQuickStatsFromNational(stats);
        this.updateActivitiesFromNational(stats);
        this.loading = false;
      },
      error: (error) => {
        console.warn('Could not load national statistics, using mock data:', error);
        // Fallback to mock data for government officials
        this.nationalStats = this.statisticsService.getMockNationalStatistics();
        this.updateQuickStatsFromNational(this.nationalStats);
        this.updateActivitiesFromNational(this.nationalStats);
        this.loading = false;
      }
    });

    // Also load aggregate inventory data for the stock table
    this.inventoryService.getAllBatches().subscribe({
      next: (batches) => {
        this.processInventoryData(batches);
      },
      error: (error) => {
        console.error('Error loading inventory data:', error);
        this.loadMockData();
      }
    });
  }

  /**
   * Load facility-specific dashboard for facility managers and health workers
   */
  loadFacilityDashboard(): void {
    console.log('Loading facility dashboard data for facility:', this.facilityId);
    
    this.inventoryService.getAllBatches().subscribe({
      next: (batches) => {
        this.processInventoryData(batches);
        this.generateRecentActivities(batches);
        this.loadHealthWorkerCardData();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
        this.loadMockData();
      }
    });
  }

  /**
   * Load Health Worker specific card data
   */
  loadHealthWorkerCardData(): void {
    // TODO: Replace with actual API calls when endpoints are available
    
    // Mock patient count
    this.healthWorkerCards[0].value = 156;
    this.healthWorkerCards[0].subtitle = 'Total registered patients';
    
    // Print card stays as "Generate"
    this.healthWorkerCards[1].value = 'Generate';
    
    // Mock defaulters count
    this.healthWorkerCards[2].value = 12;
    this.healthWorkerCards[2].subtitle = '12 patients missed vaccinations';
    this.healthWorkerCards[2].isAlert = this.healthWorkerCards[2].value as number > 0;
    
    // Mock low stock count from existing quick stats
    const lowStockCount = this.quickStats[2].value;
    this.healthWorkerCards[3].value = lowStockCount;
    this.healthWorkerCards[3].subtitle = `${lowStockCount} items below threshold`;
    this.healthWorkerCards[3].isAlert = (lowStockCount as number) > 0;
  }

  /**
   * Update quick stats from national statistics
   */
  updateQuickStatsFromNational(stats: NationalStatistics): void {
    this.quickStats[0].value = stats.totalVaccineTypes;
    this.quickStats[0].subtitle = `Across ${stats.totalFacilities} facilities`;
    
    this.quickStats[1].value = this.formatNumber(stats.totalDosesAvailable);
    this.quickStats[1].subtitle = `${this.formatNumber(stats.totalVaccinationsAdministered)} administered`;
    
    this.quickStats[2].value = stats.lowStockAlerts;
    this.quickStats[2].subtitle = `${stats.facilitiesWithAlerts} facilities need attention`;
    
    this.quickStats[3].value = stats.expiringBatches;
    this.quickStats[3].subtitle = `Across all facilities`;
  }

  /**
   * Update activities from national statistics
   */
  updateActivitiesFromNational(stats: NationalStatistics): void {
    this.recentActivities = stats.recentActivities.map(activity => ({
      action: activity.action,
      vaccine: activity.facilityName,
      user: 'System',
      time: this.formatTimeAgo(new Date(activity.timestamp)),
      icon: this.getActivityIcon(activity.type),
      type: activity.type
    }));
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    const icons = {
      success: 'check_circle',
      warning: 'warning',
      error: 'error',
      info: 'info'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  processInventoryData(batches: any[]): void {
    const vaccineGroups = new Map<string, any[]>();

    batches.forEach(batch => {
      const vaccineName = batch.vaccineName || batch.vaccine_name;
      if (!vaccineGroups.has(vaccineName)) {
        vaccineGroups.set(vaccineName, []);
      }
      vaccineGroups.get(vaccineName)!.push(batch);
    });

    this.stockLevels = Array.from(vaccineGroups.entries()).map(([name, batches]) => {
      const totalQuantity = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
      const nearestExpiry = this.calculateNearestExpiry(batches);

      return {
        vaccineName: name,
        quantity: totalQuantity,
        status: this.determineStockStatus(totalQuantity),
        expiryDays: nearestExpiry,
        batchCount: batches.length,
        manufacturer: batches[0]?.manufacturer,
        lastUpdated: new Date(batches[0]?.created_at || Date.now())
      };
    });

    this.stockLevels.sort((a, b) => {
      const statusPriority = { critical: 0, low: 1, adequate: 2, optimal: 3 };
      return statusPriority[a.status] - statusPriority[b.status];
    });

    this.updateQuickStats(batches);
  }

  calculateNearestExpiry(batches: any[]): number {
    const expiryDates = batches
      .map(b => new Date(b.expiry_date || b.expiryDate))
      .filter(d => !isNaN(d.getTime()));

    if (expiryDates.length === 0) return 999;

    const nearest = Math.min(...expiryDates.map(d => d.getTime()));
    const daysUntil = Math.floor((nearest - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysUntil);
  }

  determineStockStatus(quantity: number): 'optimal' | 'adequate' | 'low' | 'critical' {
    if (quantity >= this.OPTIMAL_THRESHOLD) return 'optimal';
    if (quantity >= this.ADEQUATE_THRESHOLD) return 'adequate';
    if (quantity >= this.LOW_THRESHOLD) return 'low';
    return 'critical';
  }

  updateQuickStats(batches: any[]): void {
    const uniqueVaccines = new Set(batches.map(b => b.vaccineName || b.vaccine_name)).size;
    const totalDoses = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const lowStock = this.stockLevels.filter(s => s.status === 'low' || s.status === 'critical').length;
    const expiringSoon = this.stockLevels.filter(s => s.expiryDays <= 30).length;

    this.quickStats[0].value = uniqueVaccines;
    this.quickStats[1].value = this.formatNumber(totalDoses);
    this.quickStats[2].value = lowStock;
    this.quickStats[3].value = expiringSoon;
  }

  generateRecentActivities(batches: any[]): void {
    this.recentActivities = batches
      .slice(0, 5)
      .map(batch => ({
        action: 'New batch registered',
        vaccine: batch.vaccineName || batch.vaccine_name,
        user: batch.created_by || this.currentUser?.username,
        time: this.formatTimeAgo(new Date(batch.created_at || Date.now())),
        icon: 'add_circle',
        type: 'success' as const
      }));

    this.stockLevels
      .filter(s => s.status === 'critical' || s.status === 'low')
      .slice(0, 3)
      .forEach(stock => {
        this.recentActivities.push({
          action: stock.status === 'critical' ? 'Critical stock level' : 'Low stock alert',
          vaccine: stock.vaccineName,
          user: 'System',
          time: 'Now',
          icon: 'warning',
          type: 'warning'
        });
      });
  }

  loadMockData(): void {
    this.stockLevels = [
      { vaccineName: 'COVID-19 (Pfizer-BioNTech)', quantity: 15000, status: 'optimal', expiryDays: 120, batchCount: 5, manufacturer: 'Pfizer' },
      { vaccineName: 'Measles-Mumps-Rubella (MMR)', quantity: 8500, status: 'optimal', expiryDays: 180, batchCount: 3, manufacturer: 'Merck' },
      { vaccineName: 'Hepatitis B', quantity: 3200, status: 'adequate', expiryDays: 90, batchCount: 2, manufacturer: 'GSK' },
      { vaccineName: 'Tetanus-Diphtheria (Td)', quantity: 1800, status: 'low', expiryDays: 60, batchCount: 2, manufacturer: 'Sanofi' },
      { vaccineName: 'Polio (IPV)', quantity: 12000, status: 'optimal', expiryDays: 150, batchCount: 4, manufacturer: 'Sanofi Pasteur' },
      { vaccineName: 'BCG (Tuberculosis)', quantity: 950, status: 'critical', expiryDays: 25, batchCount: 1, manufacturer: 'AJ Vaccines' },
    ];

    this.quickStats[0].value = 12;
    this.quickStats[1].value = '45,230';
    this.quickStats[2].value = 3;
    this.quickStats[3].value = 2;

    this.recentActivities = [
      { action: 'New batch registered', vaccine: 'COVID-19 (Pfizer)', user: 'Dr. Smith', time: '5 mins ago', icon: 'add_circle', type: 'success' },
      { action: 'Stock updated', vaccine: 'Hepatitis B', user: 'Nurse Johnson', time: '15 mins ago', icon: 'update', type: 'info' },
      { action: 'Low stock alert', vaccine: 'BCG', user: 'System', time: '1 hour ago', icon: 'warning', type: 'warning' },
      { action: 'Batch nearing expiry', vaccine: 'Tetanus-Diphtheria', user: 'System', time: '2 hours ago', icon: 'event_busy', type: 'warning' },
    ];
  }

  formatUserRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Health Worker': 'Healthcare Professional',
      'Facility Manager': 'Facility Administrator',
      'Government Official': 'Health Authority'
    };
    return roleMap[role] || role;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }

  getStatusColor(status: string): string {
    const colors = {
      optimal: '#4caf50',
      adequate: '#2196f3',
      low: '#ff9800',
      critical: '#f44336'
    };
    return colors[status as keyof typeof colors] || '#9e9e9e';
  }

  getStatusIcon(status: string): string {
    const icons = {
      optimal: 'check_circle',
      adequate: 'info',
      low: 'warning',
      critical: 'error'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getStatusLabel(status: string): string {
    const labels = {
      optimal: 'Optimal Stock',
      adequate: 'Adequate',
      low: 'Low Stock',
      critical: 'Critical'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStockHealthPercentage(status: string): number {
    const percentages = {
      optimal: 100,
      adequate: 65,
      low: 35,
      critical: 15
    };
    return percentages[status as keyof typeof percentages] || 0;
  }

  getActivityTypeClass(type: string): string {
    return `activity-${type}`;
  }

  // Navigation methods - FIXED
  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  handleCardAction(action: string): void {
    this.loaderService.show(); // Show loader for 1000ms

    switch(action) {
      case 'view-patients':
        setTimeout(() => {
          this.router.navigate(['/patients']);
        }, 1000);
        break;
      case 'print-cards':
        setTimeout(() => {
          // TODO: Implement print functionality
          this.notificationService.info('Print functionality coming soon');
        }, 1000);
        break;
      case 'view-defaulters':
        setTimeout(() => {
          this.router.navigate(['/defaulters']);
        }, 1000);
        break;
      case 'manage-stock':
        setTimeout(() => {
          this.router.navigate(['/inventory/manage-low-stock']);
        }, 1000);
        break;
      default:
        this.loaderService.forceHide();
        break;
    }
  }

  logout(): void {
    const dialogRef = this.dialog.open(LogoutConfirmationComponent, {
      width: '400px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.loaderService.show();
        this.authService.logout();
        this.notificationService.success('Logged out successfully');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 500);
      }
    });
  }

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateToSettings(): void {
    console.log('Settings navigation - to be implemented');
    // this.router.navigate(['/settings']);
  }

  navigateToAddBatch(): void {
    const facilityId = this.authService.getFacilityId();
    
    const dialogRef = this.dialog.open(AddBatchModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'custom-dialog-container',
      autoFocus: true,
      restoreFocus: true,
      data: {
        facilityId: facilityId,
        isGovernmentOfficial: this.isGovernmentOfficial
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Batch created successfully, refreshing dashboard...');
        this.loadDashboardData(); // Refresh dashboard data
      }
    });
  }

  viewBatchDetails(vaccine: StockLevel): void {
    console.log('Viewing batch details for:', vaccine.vaccineName);
    this.router.navigate(['/inventory'], {
      queryParams: { filter: vaccine.vaccineName }
    });
  }

  exportReport(): void {
    const reportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentUser?.username || 'System',
      statistics: {
        activeVaccines: this.quickStats[0].value,
        totalDoses: this.quickStats[1].value,
        stockAlerts: this.quickStats[2].value,
        expiringSoon: this.quickStats[3].value
      },
      stockLevels: this.stockLevels,
      recentActivities: this.recentActivities
    };

    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    console.log('Dashboard report exported successfully');
  }

  configureAlerts(): void {
    console.log('Configure alerts - to be implemented');
    // Future implementation for alert configuration
  }

  viewAllStock(): void {
    this.navigateToInventory();
  }

  // Handle clicks that should stop propagation
  onStockRowClick(stock: StockLevel, event?: Event): void {
    if (event) {
      // Check if the click was on an action button
      const target = event.target as HTMLElement;
      if (target.closest('.action-icon-btn') || target.closest('.col-actions')) {
        event.stopPropagation();
        return;
      }
    }
    this.viewBatchDetails(stock);
  }

  onActionButtonClick(stock: StockLevel, action: string, event: Event): void {
    event.stopPropagation();
    console.log(`Action "${action}" for ${stock.vaccineName}`);

    switch(action) {
      case 'view':
        this.viewBatchDetails(stock);
        break;
      case 'edit':
        console.log('Edit functionality - to be implemented');
        break;
      case 'more':
        console.log('More options - to be implemented');
        break;
    }
  }
}