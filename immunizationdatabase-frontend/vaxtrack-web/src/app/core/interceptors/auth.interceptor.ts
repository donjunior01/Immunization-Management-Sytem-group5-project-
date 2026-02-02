import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, retry, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const errorHandler = inject(ErrorHandlerService);
  const router = inject(Router);
  const token = authService.getToken();

  // Skip adding Authorization header for login/register endpoints
  // These endpoints should not have tokens attached
  const isAuthEndpoint = req.url.includes('/api/auth/login') || 
                         req.url.includes('/api/auth/register') ||
                         req.url.includes('/api/auth/refresh');

  // Clone request and add authorization header if token exists and not an auth endpoint
  let clonedReq = req;
  if (token && !isAuthEndpoint) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Log request in development
  if (environment.enableApiLogging && !environment.production) {
    console.log(`[API Request] ${req.method} ${req.url}`, {
      headers: req.headers.keys(),
      body: req.body
    });
  }

  // Handle response with error handling and retry logic
  return next(clonedReq).pipe(
    // Retry logic for transient failures
    retry({
      count: environment.enableErrorRetry ? environment.maxRetryAttempts : 0,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        if (errorHandler.isRetryableError(error)) {
          if (environment.enableApiLogging && !environment.production) {
            console.warn(`[API Retry] Attempt ${retryCount + 1}/${environment.maxRetryAttempts} for ${req.url}`);
          }
          return timer(environment.retryDelay * retryCount);
        }
        throw error;
      }
    }),
    // Error handling
    catchError((error: HttpErrorResponse) => {
      // Log response in development
      if (environment.enableApiLogging && !environment.production) {
        console.error(`[API Error] ${req.method} ${req.url}`, {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        // Don't redirect if already on login page or if it's a login request
        // Login requests can legitimately return 401 for invalid credentials
        if (!router.url.includes('/login') && !isAuthEndpoint) {
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
          });
        }
      }

      // Handle 403 Forbidden - insufficient permissions
      if (error.status === 403) {
        // Could show a toast notification here
        console.warn('Access forbidden:', error.error?.message || 'Insufficient permissions');
}

      // Return error for component handling
      return throwError(() => error);
    })
  );
};

