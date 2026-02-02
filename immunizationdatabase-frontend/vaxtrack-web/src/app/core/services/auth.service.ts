import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, LoginResponse, User, mapBackendRoleToFrontendRole } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private apiUrl = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenExpirationTimer: any = null;

  constructor() {
    this.loadUserFromStorage();
    this.checkTokenExpiration();
  }

  login(credentials: LoginRequest, rememberMe: boolean = false): Observable<LoginResponse> {
    // Mock authentication for development
    if (environment.useMockAuth) {
      return this.mockLogin(credentials);
    }

    // Prepare request body - backend expects username (not usernameOrEmail)
    // Extract username from usernameOrEmail if provided
    const username = credentials.usernameOrEmail || credentials.username || '';
    const requestBody = {
      username: username,
      password: credentials.password
    };

    return this.http.post<any>(`${this.apiUrl}/api/auth/login`, requestBody)
      .pipe(
        map(response => {
          if (!response || !response.token) {
            throw new Error('Invalid response from server');
          }

          // Map backend response to frontend format
          const userData = response.user || response; // Handle different response structures
          const fullName = userData.fullName || userData.name || '';
          const nameParts = fullName.split(' ').filter((part: string) => part.length > 0);

          // Handle role - backend sends enum as string (e.g., "GOVERNMENT_OFFICIAL")
          // Role can be a string directly or an object with a name property
          let backendRole = '';
          if (typeof userData.role === 'string') {
            backendRole = userData.role;
          } else if (userData.role?.name) {
            backendRole = userData.role.name;
          } else if (userData.role) {
            // If it's an object, try to get the string value
            backendRole = String(userData.role);
          }
          backendRole = backendRole.toUpperCase().trim();
          const mappedRole = mapBackendRoleToFrontendRole(backendRole);

          const mappedUser: User = {
            id: String(userData.id || userData.userId || ''),
            username: userData.username || '',
            email: userData.email,
            role: mappedRole, // This is now a UserRole enum value (which is a string)
            facilityId: userData.facilityId,
            facilityName: userData.facilityName,
            districtId: userData.districtId,
            fullName: fullName,
            firstName: nameParts[0] || userData.firstName || userData.username,
            lastName: nameParts.slice(1).join(' ') || userData.lastName || '',
            isActive: userData.active !== false,
            active: userData.active !== false,
            status: userData.status || (userData.active !== false ? 'ACTIVE' : 'INACTIVE')
          };

          // Ensure role is stored as string for consistency
          if (typeof mappedUser.role !== 'string') {
            mappedUser.role = String(mappedUser.role);
          }

          // Convert expiresIn to milliseconds if backend returns seconds
          // Backend typically returns seconds, but we need milliseconds
          let expiresInMs = response.expiresIn || 1800000; // Default 30 minutes in ms
          if (expiresInMs < 100000) {
            // If value is less than 100000, assume it's in seconds and convert
            expiresInMs = expiresInMs * 1000;
          }

          const loginResponse: LoginResponse = {
            token: response.token,
            user: mappedUser,
            expiresIn: expiresInMs
          };

          return loginResponse;
        }),
        tap(response => {
          this.setSession(response, rememberMe);
          this.scheduleTokenExpiration(response.expiresIn);
        }),
        catchError(error => {
          const apiError = this.errorHandler.handleError(error);
          return throwError(() => apiError);
        })
      );
  }

  private mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    return new Observable(observer => {
      // Simulate network delay
      setTimeout(() => {
        // Demo accounts for different roles
        const mockUsers: { [key: string]: { user: User; password: string } } = {
          'health.worker': {
            user: {
              id: '1',
              username: 'health.worker',
              email: 'health.worker@vaxtrack.com',
              role: 'HEALTH_WORKER',
              facilityId: 'FAC001',
              facilityName: 'Mvog-Ada Health Center',
              fullName: 'Dr. Sarah Mbah',
              firstName: 'Sarah',
              lastName: 'Mbah',
              isActive: true,
              active: true
            },
            password: 'password123'
          },
          'facility.manager': {
            user: {
              id: '2',
              username: 'facility.manager',
              email: 'facility.manager@vaxtrack.com',
              role: 'FACILITY_MANAGER',
              facilityId: 'FAC001',
              facilityName: 'Mvog-Ada Health Center',
              fullName: 'John Manager',
              firstName: 'John',
              lastName: 'Manager',
              isActive: true,
              active: true
            },
            password: 'password123'
          },
          'gov.official': {
            user: {
              id: '3',
              username: 'gov.official',
              email: 'gov.official@vaxtrack.com',
              role: 'GOVERNMENT_OFFICIAL',
              facilityId: '',
              facilityName: 'System Administration',
              fullName: 'Government Official',
              firstName: 'Government',
              lastName: 'Official',
              isActive: true,
              active: true
            },
            password: 'password123'
          }
        };

        // Check credentials
        const username = credentials.usernameOrEmail || credentials.username || '';
        const password = credentials.password || '';

        // Find matching user (case-insensitive username check)
        const userKey = Object.keys(mockUsers).find(key =>
          mockUsers[key].user.username.toLowerCase() === username.toLowerCase() ||
          mockUsers[key].user.email?.toLowerCase() === username.toLowerCase()
        );

        if (userKey && mockUsers[userKey].password === password) {
          const mockUser = mockUsers[userKey].user;
          const mockToken = `mock-token-${Date.now()}-${mockUser.id}`;

          const response: LoginResponse = {
            token: mockToken,
            user: mockUser,
            expiresIn: 1800000 // 30 minutes
          };

          this.setSession(response);
          observer.next(response);
          observer.complete();
        } else {
          observer.error({
            status: 401,
            error: { message: 'Invalid username or password' }
          });
        }
      }, 500); // Simulate 500ms network delay
    });
  }

  logout(): void {
    // Clear token expiration timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    // Call backend logout endpoint if not using mock auth
    if (!environment.useMockAuth && this.isAuthenticated()) {
      this.http.post(`${this.apiUrl}/api/auth/logout`, {}).subscribe({
        next: () => {
          this.clearSession();
        },
        error: () => {
          // Even if logout fails, clear local session
          this.clearSession();
        }
      });
    } else {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('rememberMe');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {// If subject is null but localStorage has user, load it
    if (!this.currentUserSubject.value) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);return user;
        } catch (e) {
          console.error('Error parsing user from storage:', e);
        }
      }
    }

    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {this.clearSession();
      return false;
    }return true;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private setSession(response: LoginResponse, rememberMe: boolean = false): void {localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Store token expiration time
    const now = Date.now();
    const expirationTime = now + response.expiresIn;
    localStorage.setItem('tokenExpiration', expirationTime.toString());// Store remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberMe');
    }

    // CRITICAL: Update current user subject IMMEDIATELY - guards depend on this
    this.currentUserSubject.next(response.user);}

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Verify token is still valid
        if (this.isTokenExpired()) {
          this.clearSession();
          return;
        }
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    const expirationTime = localStorage.getItem('tokenExpiration');
    if (!expirationTime) {return true; // No expiration time means expired
    }

    const expiration = parseInt(expirationTime, 10);
    const now = Date.now();
    const timeUntilExpiration = expiration - now;// Add 5 minute buffer before actual expiration, but only if token has more than 5 minutes left
    // If token expires in less than 5 minutes, don't apply buffer (to avoid immediate expiration)
    const buffer = Math.min(300000, Math.max(0, timeUntilExpiration)); // Use smaller of 5 min or remaining time
    const isExpired = now >= (expiration - buffer);return isExpired;
  }

  /**
   * Schedule token expiration check
   */
  private scheduleTokenExpiration(expiresIn: number): void {
    // Clear existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    // Schedule expiration check 5 minutes before actual expiration
    const checkTime = expiresIn - 300000; // 5 minutes before expiration

    if (checkTime > 0) {
      this.tokenExpirationTimer = setTimeout(() => {
        if (this.isTokenExpired()) {
          this.handleTokenExpiration();
        }
      }, checkTime);
    }
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    // Try to refresh token if refresh token is available
    // For now, just logout
    this.clearSession();
    this.router.navigate(['/login'], {
      queryParams: { expired: 'true' }
    });
  }

  /**
   * Refresh JWT token
   */
  refreshToken(refreshToken: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/refresh`, { refreshToken })
      .pipe(
        map(response => {
          if (!response || !response.token) {
            throw new Error('Invalid refresh response');
          }

          const userData = response.user || {};
          const fullName = userData.fullName || '';
          const nameParts = fullName.split(' ').filter((part: string) => part.length > 0);

          // Handle role - backend may send enum name or string
          const backendRole = userData.role?.name || userData.role || '';
          const mappedRole = mapBackendRoleToFrontendRole(backendRole);

          const mappedUser: User = {
            id: String(userData.id || ''),
            username: userData.username || '',
            email: userData.email,
            role: mappedRole,
            facilityId: userData.facilityId,
            facilityName: userData.facilityName,
            fullName: fullName,
            firstName: nameParts[0] || userData.username,
            lastName: nameParts.slice(1).join(' ') || '',
            isActive: userData.active !== false,
            active: userData.active !== false
          };

          return {
            token: response.token,
            user: mappedUser,
            expiresIn: response.expiresIn || 1800000
          };
        }),
        tap(response => {
          this.setSession(response);
          this.scheduleTokenExpiration(response.expiresIn);
        }),
        catchError(error => {
          // If refresh fails, logout
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  /**
   * Check token expiration on service initialization
   */
  private checkTokenExpiration(): void {
    if (this.isTokenExpired() && this.getToken()) {
      this.clearSession();
    } else if (this.getToken()) {
      // Reschedule expiration check
      const expirationTime = localStorage.getItem('tokenExpiration');
      if (expirationTime) {
        const expiration = parseInt(expirationTime, 10);
        const now = Date.now();
        const remaining = expiration - now - 300000; // 5 minutes buffer

        if (remaining > 0) {
          this.scheduleTokenExpiration(remaining);
        } else {
          this.handleTokenExpiration();
        }
      }
    }
  }

  /**
   * Get current user profile from backend
   */
  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/api/auth/profile`)
      .pipe(
        map(userData => {
          const fullName = userData.fullName || userData.name || '';
          const nameParts = fullName.split(' ').filter((part: string) => part.length > 0);

          // Handle role - backend may send enum name or string
          const backendRole = userData.role?.name || userData.role || '';
          const mappedRole = mapBackendRoleToFrontendRole(backendRole);

          const mappedUser: User = {
            id: String(userData.id || ''),
            username: userData.username || '',
            email: userData.email,
            role: mappedRole,
            facilityId: userData.facilityId,
            facilityName: userData.facilityName,
            fullName: fullName,
            firstName: nameParts[0] || userData.firstName || userData.username,
            lastName: nameParts.slice(1).join(' ') || userData.lastName || '',
            isActive: userData.active !== false,
            active: userData.active !== false
          };

          // Update current user
          this.currentUserSubject.next(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));

          return mappedUser;
        }),
        catchError(error => {
          const apiError = this.errorHandler.handleError(error);
          return throwError(() => apiError);
        })
      );
  }
}

