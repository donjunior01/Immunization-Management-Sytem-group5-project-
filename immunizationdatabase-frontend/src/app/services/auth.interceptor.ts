import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip adding auth header for public endpoints (login, register, etc.)
    const isPublicEndpoint = request.url.includes('/auth/login') ||
                              request.url.includes('/auth/register') ||
                              request.url.includes('/auth/refresh') ||
                              request.url.includes('/auth/logout');

    // Get token from auth service
    const token = this.authService.getToken();

    // Clone request and add authorization header if token exists and not a public endpoint
    if (token && !isPublicEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Unauthorized - token expired or invalid
          console.error('Authentication error - redirecting to login');
          this.authService.logout();
        }

        if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.error('Access forbidden');
          // Only redirect to login if the request is for navigation/auth endpoints, not background API calls
          const isNavigationAttempt = request.url.includes('/dashboard') || request.url.includes('/profile') || request.url.includes('/settings');
          if (!isPublicEndpoint && isNavigationAttempt) {
            this.router.navigate(['/login']);
          }
          // For background API calls (e.g., stock alerts), do NOT redirect, just propagate the error
        }

        return throwError(() => error);
      })
    );
  }
}
