import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full'
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'facilities',
        loadComponent: () => import('./pages/admin/facilities/admin-facilities.component').then(m => m.AdminFacilitiesComponent)
      },
      {
        path: 'vaccines',
        loadComponent: () => import('./pages/admin/vaccines/admin-vaccines.component').then(m => m.AdminVaccinesComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'settings/vaccines',
        loadComponent: () => import('./pages/admin/settings/vaccines/admin-vaccines-settings.component').then(m => m.AdminVaccinesSettingsComponent)
      },
      {
        path: 'settings/schedule',
        loadComponent: () => import('./pages/admin/settings/schedule/admin-schedule-settings.component').then(m => m.AdminScheduleSettingsComponent)
      },
      {
        path: 'sms-config',
        loadComponent: () => import('./pages/admin/sms-config/admin-sms-config.component').then(m => m.AdminSmsConfigComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/admin/audit-logs/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent)
      },
      {
        path: 'vaccinations/record',
        loadComponent: () => import('./pages/vaccinator/vaccinations/record/record-vaccination.component').then(m => m.RecordVaccinationComponent)
      },
      {
        path: 'patients/register',
        loadComponent: () => import('./pages/vaccinator/patients/register/register-patient.component').then(m => m.RegisterPatientComponent)
      },
      {
        path: 'patients/search',
        loadComponent: () => import('./pages/vaccinator/patients/search/patient-search.component').then(m => m.PatientSearchComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./pages/vaccinator/patients/detail/patient-detail.component').then(m => m.PatientDetailComponent)
      }
    ]
  },
  {
    path: 'vaccinator',
    canActivate: [authGuard, roleGuard(['HEALTH_WORKER', 'FACILITY_MANAGER'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/vaccinator/dashboard/vaccinator-dashboard.component').then(m => m.VaccinatorDashboardComponent)
      },
      {
        path: 'patients/register',
        loadComponent: () => import('./pages/vaccinator/patients/register/register-patient.component').then(m => m.RegisterPatientComponent)
      },
      {
        path: 'patients/search',
        loadComponent: () => import('./pages/vaccinator/patients/search/patient-search.component').then(m => m.PatientSearchComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./pages/vaccinator/patients/detail/patient-detail.component').then(m => m.PatientDetailComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./pages/vaccinator/patients/vaccinator-patients.component').then(m => m.VaccinatorPatientsComponent)
      },
      {
        path: 'vaccinations/record',
        loadComponent: () => import('./pages/vaccinator/vaccinations/record/record-vaccination.component').then(m => m.RecordVaccinationComponent)
      },
      {
        path: 'vaccinations',
        loadComponent: () => import('./pages/manager/vaccinations/manager-vaccinations.component').then(m => m.ManagerVaccinationsComponent)
      },
      {
        path: 'appointments/today',
        loadComponent: () => import('./pages/vaccinator/appointments/vaccinator-appointments.component').then(m => m.VaccinatorAppointmentsComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/vaccinator/appointments/vaccinator-appointments.component').then(m => m.VaccinatorAppointmentsComponent)
      },
      {
        path: 'stock',
        loadComponent: () => import('./pages/vaccinator/stock/vaccinator-stock.component').then(m => m.VaccinatorStockComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/vaccinator/reports/vaccinator-reports.component').then(m => m.VaccinatorReportsComponent)
      }
    ]
  },
  {
    path: 'manager',
    canActivate: [authGuard, roleGuard(['FACILITY_MANAGER'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
      },
      {
        path: 'patients',
        loadComponent: () => import('./pages/vaccinator/patients/register/register-patient.component').then(m => m.RegisterPatientComponent)
      },
      {
        path: 'vaccinations',
        loadComponent: () => import('./pages/manager/vaccinations/manager-vaccinations.component').then(m => m.ManagerVaccinationsComponent)
      },
      {
        path: 'vaccinations/record',
        loadComponent: () => import('./pages/vaccinator/vaccinations/record/record-vaccination.component').then(m => m.RecordVaccinationComponent)
      },
      {
        path: 'patients/register',
        loadComponent: () => import('./pages/vaccinator/patients/register/register-patient.component').then(m => m.RegisterPatientComponent)
      },
      {
        path: 'patients/search',
        loadComponent: () => import('./pages/vaccinator/patients/search/patient-search.component').then(m => m.PatientSearchComponent)
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./pages/vaccinator/patients/detail/patient-detail.component').then(m => m.PatientDetailComponent)
      },
      {
        path: 'stock',
        loadComponent: () => import('./pages/manager/stock/manager-stock.component').then(m => m.ManagerStockComponent)
      },
      {
        path: 'stock/receive',
        loadComponent: () => import('./pages/manager/stock/receive/manager-receive-stock.component').then(m => m.ManagerReceiveStockComponent)
      },
      {
        path: 'stock/adjust',
        loadComponent: () => import('./pages/manager/stock/adjust/manager-adjust-stock.component').then(m => m.ManagerAdjustStockComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./pages/manager/staff/manager-staff.component').then(m => m.ManagerStaffComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/manager/appointments/manager-appointments.component').then(m => m.ManagerAppointmentsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/manager/reports/manager-reports.component').then(m => m.ManagerReportsComponent)
      },
      {
        path: 'reports/coverage',
        loadComponent: () => import('./pages/manager/reports/coverage/manager-coverage-report.component').then(m => m.ManagerCoverageReportComponent)
      },
      {
        path: 'reports/defaulters',
        loadComponent: () => import('./pages/manager/reports/defaulters/manager-defaulters-report.component').then(m => m.ManagerDefaultersReportComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/manager/alerts/manager-alerts.component').then(m => m.ManagerAlertsComponent)
      }
    ]
  },
  {
    path: 'district',
    canActivate: [authGuard, roleGuard(['GOVERNMENT_OFFICIAL', 'FACILITY_MANAGER'])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/district/dashboard/district-dashboard.component').then(m => m.DistrictDashboardComponent)
      },
      {
        path: 'facilities',
        loadComponent: () => import('./pages/district/facilities/district-facilities.component').then(m => m.DistrictFacilitiesComponent)
      },
      {
        path: 'reports/coverage',
        loadComponent: () => import('./pages/district/reports/coverage/district-coverage-report.component').then(m => m.DistrictCoverageReportComponent)
      },
      {
        path: 'stock',
        loadComponent: () => import('./pages/district/stock/district-stock.component').then(m => m.DistrictStockComponent)
      },
      {
        path: 'campaigns',
        loadComponent: () => import('./pages/district/campaigns/district-campaigns.component').then(m => m.DistrictCampaignsComponent)
      },
      {
        path: 'defaulters',
        loadComponent: () => import('./pages/district/defaulters/district-defaulters.component').then(m => m.DistrictDefaultersComponent)
      },
      {
        path: 'data-quality',
        loadComponent: () => import('./pages/district/data-quality/district-data-quality.component').then(m => m.DistrictDataQualityComponent)
      },
      {
        path: 'sms',
        loadComponent: () => import('./pages/district/sms/district-sms.component').then(m => m.DistrictSmsComponent)
      },
      {
        path: 'export',
        loadComponent: () => import('./pages/district/export/district-export.component').then(m => m.DistrictExportComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/landing'
  }
];
