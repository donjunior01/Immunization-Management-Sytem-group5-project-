import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ConnectivityStatus {
  isConnected: boolean;
  responseTime?: number;
  error?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BackendConnectivityService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Test backend connectivity
   */
  testConnection(): Observable<ConnectivityStatus> {
    const startTime = Date.now();
    
    return this.http.get(`${this.apiUrl}/auth/health`, { 
      observe: 'response',
      responseType: 'text'
    }).pipe(
      timeout(5000), // 5 second timeout
      map(response => {
        const responseTime = Date.now() - startTime;
        return {
          isConnected: true,
          responseTime,
          timestamp: new Date()
        };
      }),
      catchError(error => {
        const responseTime = Date.now() - startTime;
        return of({
          isConnected: false,
          responseTime,
          error: error.message || 'Connection failed',
          timestamp: new Date()
        });
      })
    );
  }

  /**
   * Check if backend is available
   */
  isBackendAvailable(): Observable<boolean> {
    return this.testConnection().pipe(
      map(status => status.isConnected)
    );
  }

  /**
   * Get backend health status
   */
  getHealthStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/health`).pipe(
      catchError(error => {
        console.error('Backend health check failed:', error);
        return throwError(() => error);
      })
    );
  }
}









