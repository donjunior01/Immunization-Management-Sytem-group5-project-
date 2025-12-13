import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
  roles: string[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUserRole: string = '';
  menuItems: MenuItem[] = [];

  private allMenuItems: MenuItem[] = [
    // Dashboard (All Roles)
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard/default',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
    },

    // Patient Management (Health Workers)
    {
      label: 'Patients',
      icon: 'people',
      route: '/patients',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER'],
      children: [
        {
          label: 'Register Patient',
          icon: 'person_add',
          route: '/patients/register',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'Patient List',
          icon: 'list',
          route: '/patients/list',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'Defaulters',
          icon: 'warning',
          route: '/patients/defaulters',
          badge: 15,
          badgeColor: 'warn',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        }
      ]
    },

    // Vaccination (Health Workers)
    {
      label: 'Vaccinations',
      icon: 'vaccines',
      route: '/vaccinations',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER'],
      children: [
        {
          label: 'Record Vaccination',
          icon: 'add_circle',
          route: '/vaccinations/record',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'Vaccination History',
          icon: 'history',
          route: '/vaccinations/history',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'Print Card',
          icon: 'print',
          route: '/vaccinations/print',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        }
      ]
    },

    // Inventory Management
    {
      label: 'Inventory',
      icon: 'inventory_2',
      route: '/inventory',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'],
      children: [
        {
          label: 'Stock Levels',
          icon: 'assessment',
          route: '/inventory/stock-levels',
          badge: 3,
          badgeColor: 'warn',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        },
        {
          label: 'Add Batch',
          icon: 'add_box',
          route: '/inventory/add-batch',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'View Batches',
          icon: 'view_list',
          route: '/inventory',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER']
        },
        {
          label: 'Expiry Alerts',
          icon: 'notifications_active',
          route: '/inventory/expiry-alerts',
          badge: 5,
          badgeColor: 'warn',
          roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        }
      ]
    },

    // Campaigns
    {
      label: 'Campaigns',
      icon: 'campaign',
      roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'],
      children: [
        {
          label: 'Create Campaign',
          icon: 'add_circle',
          route: '/campaigns/create',
          roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        },
        {
          label: 'Active Campaigns',
          icon: 'list',
          route: '/campaigns/active',
          roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        },
        {
          label: 'Campaign Progress',
          icon: 'analytics',
          route: '/campaigns/progress',
          roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        }
      ]
    },

    // Reports & Analytics
    {
      label: 'Reports',
      icon: 'analytics',
      route: '/reports',
      roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'],
      children: [
        {
          label: 'Coverage Rates',
          icon: 'pie_chart',
          route: '/reports/coverage',
          roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        },
        {
          label: 'Stock Report',
          icon: 'inventory',
          route: '/reports/stock',
          roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
        },
        {
          label: 'Facility Comparison',
          icon: 'compare_arrows',
          route: '/reports/facility-comparison',
          roles: ['GOVERNMENT_OFFICIAL']
        }
      ]
    },

    // System Monitoring (Government Official only)
    {
      label: 'System Monitoring',
      icon: 'monitor_heart',
      route: '/monitoring/system',
      roles: ['GOVERNMENT_OFFICIAL']
    },

    // Sync Status
    {
      label: 'Sync Status',
      icon: 'sync',
      route: '/sync-status',
      badge: 12,
      badgeColor: 'accent',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
    },

    // My Profile
    {
      label: 'My Profile',
      icon: 'person',
      route: '/my-profile',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
    },

    // Settings
    {
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
      roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL']
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserRole = currentUser?.role || '';
    this.filterMenuByRole();
  }

  filterMenuByRole(): void {
    this.menuItems = this.allMenuItems.filter(item =>
      item.roles.includes(this.currentUserRole)
    ).map(item => ({
      ...item,
      children: item.children?.filter(child =>
        child.roles.includes(this.currentUserRole)
      )
    }));
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
