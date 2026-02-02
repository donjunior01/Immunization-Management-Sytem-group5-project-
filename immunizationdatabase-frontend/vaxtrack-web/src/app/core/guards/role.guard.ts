import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { mapBackendRoleToFrontendRole } from '../models/user.model';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {console.warn('[RoleGuard] User not authenticated, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const user = authService.getCurrentUser();
    if (!user) {console.warn('[RoleGuard] No user found, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Normalize role to uppercase for comparison
    // Handle both enum values and string roles
    const userRoleRaw = user.role;
    let userRole = '';
    if (typeof userRoleRaw === 'string') {
      userRole = userRoleRaw.toUpperCase().trim();
    } else if (userRoleRaw) {
      // If it's an enum or object, convert to string
      userRole = String(userRoleRaw).toUpperCase().trim();
    } else {
      console.error('[RoleGuard] User role is null or undefined:', user);
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
    
    // Normalize allowed roles to uppercase
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());// Check if user's role matches any allowed role (direct match only - no aliases)
    const hasAccess = normalizedAllowedRoles.includes(userRole);if (hasAccess) {
      console.log('[RoleGuard] Access granted. User role:', userRole, 'Route:', state.url);
      return true;
    }

    console.warn('[RoleGuard] Access denied. User role:', userRole, 'Required roles:', normalizedAllowedRoles, 'Route:', state.url);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url, accessDenied: 'true' } });
    return false;
  };
};
