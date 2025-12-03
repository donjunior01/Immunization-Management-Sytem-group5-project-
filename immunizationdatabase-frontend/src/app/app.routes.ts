import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  // Default route - redirect to login if not authenticated
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

  // Protected routes - require authentication
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Dashboard - ImmunizeDB'
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
        path: 'view/:id',
        loadComponent: () => import('./inventory/view-batch/view-batch.component')
          .then(m => m.ViewBatchComponent),
        title: 'View Batch - ImmunizeDB'
      }
    ]
  },

  // Unauthorized page
  {
    path: 'unauthorized',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // 404 - redirect to dashboard if authenticated, login if not
  {
    path: '**',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];