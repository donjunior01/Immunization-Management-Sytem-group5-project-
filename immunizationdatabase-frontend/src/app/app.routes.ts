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

      // Settings
      {
        path: 'settings',
        canActivate: [AuthGuard],
        loadComponent: () => import('./settings/settings.component')
          .then(m => m.SettingsComponent),
        title: 'Settings - ImmunizeDB'
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
