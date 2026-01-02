import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { environment } from '../../../environments/environment';

export interface ApiError {
  message: string;
  status: number;
  timestamp?: string;
  path?: string;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private router = inject(Router);
  private toastService = inject(ToastService);

  /**
   * Handle HTTP errors and return user-friendly messages
   */
  handleError(error: HttpErrorResponse): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.status || 0,
      timestamp: new Date().toISOString(),
      path: error.url || '',
      details: error.error
    };

    // Network errors
    if (error.status === 0) {
      apiError.message = 'Cannot connect to server. Please check your internet connection and ensure the backend is running.';
      return apiError;
    }

    // Extract error message from response
    if (error.error) {
      if (typeof error.error === 'string') {
        apiError.message = error.error;
      } else if (error.error.message) {
        apiError.message = error.error.message;
      } else if (error.error.error) {
        apiError.message = error.error.error;
      }
    }

    // Map HTTP status codes to user-friendly messages
    switch (error.status) {
      case 400:
        apiError.message = apiError.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        // For login/register endpoints, preserve the original error message
        // For other endpoints, use session expired message
        const isAuthEndpoint = apiError.path?.includes('/api/auth/login') || 
                               apiError.path?.includes('/api/auth/register');
        
        if (!isAuthEndpoint) {
          // Only override message for non-auth endpoints
          apiError.message = apiError.message || 'Your session has expired. Please log in again.';
        this.handleUnauthorized();
        }
        // For auth endpoints, keep the original message from the backend
        break;
      case 403:
        apiError.message = apiError.message || 'You do not have permission to perform this action.';
        break;
      case 404:
        apiError.message = apiError.message || 'The requested resource was not found.';
        break;
      case 409:
        apiError.message = apiError.message || 'A conflict occurred. The resource may already exist.';
        break;
      case 422:
        apiError.message = apiError.message || 'Validation error. Please check your input.';
        break;
      case 500:
        apiError.message = 'Server error. Please try again later or contact support.';
        break;
      case 503:
        apiError.message = 'Service temporarily unavailable. Please try again later.';
        break;
      default:
        if (apiError.message === 'An unexpected error occurred') {
          apiError.message = `Error ${error.status}: ${apiError.message}`;
        }
    }

    // Log error in development
    if (environment.enableApiLogging && !environment.production) {
      console.error('API Error:', {
        status: apiError.status,
        message: apiError.message,
        path: apiError.path,
        details: apiError.details
      });
    }

    return apiError;
  }

  /**
   * Handle 401 Unauthorized - redirect to login
   * Note: We clear the session directly to avoid circular dependency with AuthService
   */
  private handleUnauthorized(): void {
    // Clear session directly without calling AuthService to avoid circular dependency
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('rememberMe');
    
    // Navigate to login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url, expired: 'true' }
    });
    
    this.toastService.error('Your session has expired. Please log in again.');
  }

  /**
   * Check if error is retryable (transient failure)
   */
  isRetryableError(error: HttpErrorResponse): boolean {
    if (!environment.enableErrorRetry) {
      return false;
    }

    // Retry on network errors or server errors (5xx)
    if (error.status === 0 || (error.status >= 500 && error.status < 600)) {
      return true;
    }

    // Retry on specific status codes
    const retryableStatuses = [408, 429, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Get user-friendly error message for display
   */
  getErrorMessage(error: HttpErrorResponse | ApiError): string {
    if (error instanceof HttpErrorResponse) {
      return this.handleError(error).message;
    }
    return error.message;
  }

  /**
   * Extract validation errors from response
   */
  getValidationErrors(error: HttpErrorResponse): { [key: string]: string[] } {
    if (error.status === 422 && error.error?.errors) {
      return error.error.errors;
    }
    return {};
  }
}

