import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();
// Check if user is authenticated (includes token expiration check)
  if (isAuthenticated) {
    return true;
  }
// Redirect to login with return URL
  router.navigate(['/login'], { 
    queryParams: { 
      returnUrl: state.url,
      expired: route.queryParams['expired'] || undefined
    } 
  });
  return false;
};

