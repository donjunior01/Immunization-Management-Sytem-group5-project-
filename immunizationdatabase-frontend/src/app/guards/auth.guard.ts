import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, User } from '../services/auth.service';

/**
 * Route Guard for protecting authenticated routes
 * User Story 1.1: User Authentication System
 * User Story 1.2: Role-Based Dashboard Access
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Not logged in, redirect to login page with return url
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Check for role-based access (User Story 1.2)
    const requiredRoles = route.data['roles'] as User['role'][];

    if (requiredRoles && requiredRoles.length > 0) {
      // Check if user has any of the required roles
      if (!this.authService.hasAnyRole(requiredRoles)) {
        // User doesn't have required role, redirect to unauthorized page
        return this.router.createUrlTree(['/unauthorized']);
      }
    }

    // User is authenticated and has required role (if specified)
    return true;
  }
}

/**
 * Example usage in routing:
 *
 * // Protect route with authentication only
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [AuthGuard]
 * }
 *
 * // Protect route with specific roles
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [AuthGuard],
 *   data: { roles: ['Government Official'] }
 * }
 *
 * // Protect route with multiple allowed roles
 * {
 *   path: 'inventory',
 *   component: InventoryComponent,
 *   canActivate: [AuthGuard],
 *   data: { roles: ['Health Worker', 'Facility Manager'] }
 * }
 */