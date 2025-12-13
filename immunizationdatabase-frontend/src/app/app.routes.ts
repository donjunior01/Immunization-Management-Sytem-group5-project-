import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { HealthWorkerDashboardComponent } from './dashboard/health-worker-dashboard/health-worker-dashboard.component';
import { FacilityManagerDashboardComponent } from './dashboard/facility-manager-dashboard/facility-manager-dashboard.component';
import { GovernmentOfficialDashboardComponent } from './dashboard/government-official-dashboard/government-official-dashboard.component';

export const routes: Routes = [
  // Default route - redirect to dashboard
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Public routes
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login - ImmunizeDB'
  },

  // Protected routes with layout wrapper
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Dashboard - redirects to role-specific dashboard
      {
        path: 'dashboard',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        canActivate: [AuthGuard],
        component: HealthWorkerDashboardComponent, // Default, will be overridden by guard logic
        title: 'Dashboard - ImmunizeDB'
      },

      // Role-specific dashboards
      {
        path: 'dashboard/health-worker',
        component: HealthWorkerDashboardComponent,
        canActivate: [AuthGuard],
        data: { roles: ['HEALTH_WORKER'] },
        title: 'Health Worker Dashboard - ImmunizeDB'
      },
      {
        path: 'dashboard/facility-manager',
        component: FacilityManagerDashboardComponent,
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        title: 'Facility Manager Dashboard - ImmunizeDB'
      },
      {
        path: 'dashboard/government-official',
        component: GovernmentOfficialDashboardComponent,
        canActivate: [AuthGuard],
        data: { roles: ['GOVERNMENT_OFFICIAL'] },
        title: 'Government Official Dashboard - ImmunizeDB'
      },

      // Patient routes
      {
        path: 'patients',
        canActivate: [AuthGuard],
        data: { roles: ['HEALTH_WORKER', 'FACILITY_MANAGER'] },
        children: [
          {
            path: 'register',
            loadComponent: () => import('./patients/register-patient/register-patient.component')
              .then(m => m.RegisterPatientComponent),
            title: 'Register Patient - ImmunizeDB'
          },
          {
            path: 'list',
            loadComponent: () => import('./patients/patient-list/patient-list.component')
              .then(m => m.PatientListComponent),
            title: 'Patient List - ImmunizeDB'
          },
          {
            path: 'defaulters',
            loadComponent: () => import('./patients/defaulters-list/defaulters-list.component')
              .then(m => m.DefaultersListComponent),
            title: 'Defaulters - ImmunizeDB'
          }
        ]
      },

      // Vaccination routes
      {
        path: 'vaccinations',
        canActivate: [AuthGuard],
        data: { roles: ['HEALTH_WORKER', 'FACILITY_MANAGER'] },
        children: [
          {
            path: 'record',
            loadComponent: () => import('./vaccinations/record-vaccination/record-vaccination.component')
              .then(m => m.RecordVaccinationComponent),
            title: 'Record Vaccination - ImmunizeDB'
          },
          {
            path: 'history',
            loadComponent: () => import('./vaccinations/vaccination-history/vaccination-history.component')
              .then(m => m.VaccinationHistoryComponent),
            title: 'Vaccination History - ImmunizeDB'
          },
          {
            path: 'print/:patientId',
            loadComponent: () => import('./vaccinations/print-card/print-card.component')
              .then(m => m.PrintCardComponent),
            title: 'Print Vaccination Card - ImmunizeDB'
          }
        ]
      },

      // Inventory routes
      {
        path: 'inventory',
        canActivate: [AuthGuard],
        data: { roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./inventory/inventory-list/inventory-list.component')
              .then(m => m.InventoryListComponent),
            title: 'Inventory - ImmunizeDB'
          },
          {
            path: 'add-batch',
            loadComponent: () => import('./inventory/add-batch/add-batch.component')
              .then(m => m.AddBatchComponent),
            title: 'Add Batch - ImmunizeDB'
          },
          {
            path: 'view/:id',
            loadComponent: () => import('./inventory/view-batch/view-batch.component')
              .then(m => m.ViewBatchComponent),
            title: 'View Batch - ImmunizeDB'
          },
          {
            path: 'stock-levels',
            loadComponent: () => import('./inventory/stock-level/stock-level.component')
              .then(m => m.StockLevelComponent),
            title: 'Stock Levels - ImmunizeDB'
          },
          {
            path: 'expiry-alerts',
            loadComponent: () => import('./inventory/expiry-alerts/expiry-alerts.component')
              .then(m => m.ExpiryAlertsComponent),
            title: 'Expiry Alerts - ImmunizeDB'
          }
        ]
      },

      // Campaign routes
      {
        path: 'campaigns',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        children: [
          {
            path: 'create',
            loadComponent: () => import('./campaigns/create/create-campaign.component')
              .then(m => m.CreateCampaignComponent),
            title: 'Create Campaign - ImmunizeDB'
          },
          {
            path: 'active',
            loadComponent: () => import('./campaigns/active/active-campaigns.component')
              .then(m => m.ActiveCampaignsComponent),
            title: 'Active Campaigns - ImmunizeDB'
          },
          {
            path: 'progress',
            loadComponent: () => import('./campaigns/progress/campaign-progress.component')
              .then(m => m.CampaignProgressComponent),
            title: 'Campaign Progress - ImmunizeDB'
          }
        ]
      },

      // Reports routes
      {
        path: 'reports',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        children: [
          {
            path: 'coverage',
            loadComponent: () => import('./reports/coverage/coverage-report.component')
              .then(m => m.CoverageReportComponent),
            title: 'Coverage Report - ImmunizeDB'
          },
          {
            path: 'stock',
            loadComponent: () => import('./reports/stock/stock-report.component')
              .then(m => m.StockReportComponent),
            title: 'Stock Report - ImmunizeDB'
          },
          {
            path: 'facility-comparison',
            loadComponent: () => import('./reports/facility-comparison/facility-comparison.component')
              .then(m => m.FacilityComparisonComponent),
            title: 'Facility Comparison - ImmunizeDB'
          }
        ]
      },

      // Sync Status
      {
        path: 'sync-status',
        canActivate: [AuthGuard],
        data: { roles: ['HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        loadComponent: () => import('./sync/sync-status/sync-status.component')
          .then(m => m.SyncStatusComponent),
        title: 'Sync Status - ImmunizeDB'
      },

      // User Management (Facility Manager only)
      {
        path: 'user-management',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./users/user-management/user-management.component')
          .then(m => m.UserManagementComponent),
        title: 'User Management - ImmunizeDB'
      },

      // Facility Settings (Facility Manager only)
      {
        path: 'facility-settings',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./facility/facility-settings/facility-settings.component')
          .then(m => m.FacilitySettingsComponent),
        title: 'Facility Settings - ImmunizeDB'
      },

      // Facility Profile (Facility Manager only)
      {
        path: 'facility-profile',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./facility/facility-profile/facility-profile.component')
          .then(m => m.FacilityProfileComponent),
        title: 'Facility Profile - ImmunizeDB'
      },

      // Manage Campaigns (Facility Manager only)
      {
        path: 'campaigns/manage',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        loadComponent: () => import('./campaigns/manage-campaigns/manage-campaigns.component')
          .then(m => m.ManageCampaignsComponent),
        title: 'Manage Campaigns - ImmunizeDB'
      },

      // Campaign Analytics (Facility Manager and Government Official)
      {
        path: 'campaigns/analytics',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        loadComponent: () => import('./campaigns/campaign-analytics/campaign-analytics.component')
          .then(m => m.CampaignAnalyticsComponent),
        title: 'Campaign Analytics - ImmunizeDB'
      },

      // Inventory Dashboard (Facility Manager only)
      {
        path: 'inventory/dashboard',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./inventory/inventory-dashboard/inventory-dashboard.component')
          .then(m => m.InventoryDashboardComponent),
        title: 'Inventory Dashboard - ImmunizeDB'
      },

      // Stock Alerts (Facility Manager only)
      {
        path: 'alerts/stock',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./alerts/stock-alerts/stock-alerts.component')
          .then(m => m.StockAlertsComponent),
        title: 'Stock Alerts - ImmunizeDB'
      },

      // Coverage Report (Facility Manager & Government Official)
      {
        path: 'reports/coverage',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        loadComponent: () => import('./reports/coverage/coverage-report.component')
          .then(m => m.CoverageReportComponent),
        title: 'Coverage Report - ImmunizeDB'
      },

      // Stock Report (Facility Manager)
      {
        path: 'reports/stock',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./reports/stock/stock-report.component')
          .then(m => m.StockReportComponent),
        title: 'Stock Report - ImmunizeDB'
      },

      // Facility Comparison (Facility Manager & Government Official)
      {
        path: 'reports/comparison',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL'] },
        loadComponent: () => import('./reports/comparison/facility-comparison.component')
          .then(m => m.FacilityComparisonComponent),
        title: 'Facility Comparison - ImmunizeDB'
      },

      // Notifications Center (Facility Manager)
      {
        path: 'notifications',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./notifications/notifications-center.component')
          .then(m => m.NotificationsCenterComponent),
        title: 'Notifications Center - ImmunizeDB'
      },

      // Alerts Management (Facility Manager)
      {
        path: 'alerts/management',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./alerts/alerts-management/alerts-management.component')
          .then(m => m.AlertsManagementComponent),
        title: 'Alerts Management - ImmunizeDB'
      },

      // Activity Log (Facility Manager)
      {
        path: 'activity-log',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./activity-log/activity-log.component')
          .then(m => m.ActivityLogComponent),
        title: 'Activity Log - ImmunizeDB'
      },

      // My Profile
      {
        path: 'my-profile',
        canActivate: [AuthGuard],
        loadComponent: () => import('./profile/my-profile/my-profile.component')
          .then(m => m.MyProfileComponent),
        title: 'My Profile - ImmunizeDB'
      },

      // Facility Management
      {
        path: 'facilities/management',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./facilities/facility-management/facility-management.component')
          .then(m => m.FacilityManagementComponent),
        title: 'Facility Management - ImmunizeDB'
      },

      // Vaccine Allocation
      {
        path: 'allocation/vaccines',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./allocation/vaccine-allocation/vaccine-allocation.component')
          .then(m => m.VaccineAllocationComponent),
        title: 'Vaccine Allocation - ImmunizeDB'
      },

      // Cold Chain Monitoring
      {
        path: 'monitoring/cold-chain',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./monitoring/cold-chain/cold-chain.component')
          .then(m => m.ColdChainComponent),
        title: 'Cold Chain Monitoring - ImmunizeDB'
      },

      // Wastage Management
      {
        path: 'wastage/management',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./wastage/wastage-management/wastage-management.component')
          .then(m => m.WastageManagementComponent),
        title: 'Wastage Management - ImmunizeDB'
      },

      // Forecast & Planning
      {
        path: 'planning/forecast',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./planning/forecast-planning/forecast-planning.component')
          .then(m => m.ForecastPlanningComponent),
        title: 'Forecast & Planning - ImmunizeDB'
      },

      // Vaccine Utilization Analysis
      {
        path: 'analysis/utilization',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/utilization-analysis/utilization-analysis.component')
          .then(m => m.UtilizationAnalysisComponent),
        title: 'Vaccine Utilization Analysis - ImmunizeDB'
      },

      // Coverage Gap Analysis
      {
        path: 'analysis/coverage-gap',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/coverage-gap/coverage-gap.component')
          .then(m => m.CoverageGapComponent),
        title: 'Coverage Gap Analysis - ImmunizeDB'
      },

      // Geographic Distribution Analysis
      {
        path: 'analysis/geographic-distribution',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/geographic-distribution/geographic-distribution.component')
          .then(m => m.GeographicDistributionComponent),
        title: 'Geographic Distribution Analysis - ImmunizeDB'
      },

      // Dose Schedule Optimization
      {
        path: 'analysis/dose-schedule',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/dose-schedule/dose-schedule.component')
          .then(m => m.DoseScheduleComponent),
        title: 'Dose Schedule Optimization - ImmunizeDB'
      },

      // Vaccine Efficacy Tracking
      {
        path: 'analysis/vaccine-efficacy',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/vaccine-efficacy/vaccine-efficacy.component')
          .then(m => m.VaccineEfficacyComponent),
        title: 'Vaccine Efficacy Tracking - ImmunizeDB'
      },

      // Adverse Events Analysis
      {
        path: 'analysis/adverse-events',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./analysis/adverse-events/adverse-events.component')
          .then(m => m.AdverseEventsComponent),
        title: 'Adverse Events Analysis - ImmunizeDB'
      },

      // Monitoring - System Monitoring
      {
        path: 'monitoring/system-monitoring',
        canActivate: [AuthGuard],
        data: { roles: ['ADMIN', 'SYSTEM_ADMINISTRATOR'] },
        loadComponent: () => import('./monitoring/system-monitoring/system-monitoring.component')
          .then(m => m.SystemMonitoringComponent),
        title: 'System Monitoring - ImmunizeDB'
      },

      // Settings
      {
        path: 'settings',
        canActivate: [AuthGuard],
        loadComponent: () => import('./settings/settings.component')
          .then(m => m.SettingsComponent),
        title: 'Settings - ImmunizeDB'
      },

      // Facility Manager Settings
      {
        path: 'settings/facility-manager',
        canActivate: [AuthGuard],
        data: { roles: ['FACILITY_MANAGER'] },
        loadComponent: () => import('./settings/facility-manager/facility-manager-settings.component')
          .then(m => m.FacilityManagerSettingsComponent),
        title: 'Facility Manager Settings - ImmunizeDB'
      }
    ]
  },

  // Unauthorized page
  {
    path: 'unauthorized',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // 404 - redirect to dashboard
  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
