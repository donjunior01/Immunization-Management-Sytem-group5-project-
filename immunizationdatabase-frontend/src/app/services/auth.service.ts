import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

// User interface - matches backend UserResponse
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'HEALTH_WORKER' | 'FACILITY_MANAGER' | 'GOVERNMENT_OFFICIAL';
  fullName?: string;
  facilityId?: string;
}

// Login response interface - matches backend LoginResponse
export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // Backend URL
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize currentUser from localStorage
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Login method - User Story 1.1: User Authentication System
   * @param username - User's username
   * @param password - User's password
   * @returns Observable with login response
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const loginData = { username, password };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => this.handleLoginSuccess(response)),
        catchError(error => this.handleLoginError(error))
      );
  }

  /**
   * Handle successful login - User Story 1.1
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Store user data and token in localStorage
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    localStorage.setItem('authToken', response.token);

    if (response.expiresIn) {
      const expiryTime = Date.now() + (response.expiresIn * 1000);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    }

    // Update current user subject
    this.currentUserSubject.next(response.user);
  }

  /**
   * Handle login error - User Story 1.1
   */
  private handleLoginError(error: any): Observable<never> {
    let errorMessage = 'Login failed. Please try again.';

    if (error.status === 401) {
      errorMessage = 'Invalid username or password';
    } else if (error.status === 403) {
      errorMessage = error.error?.message || 'Account is locked. Please contact administrator.';
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please check your connection.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => ({ message: errorMessage }));
  }

  /**
   * Logout method - User Story 1.1
   * Clears user session and navigates to login
   */
  logout(): void {
    // Call backend logout endpoint (optional)
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => console.log('Logged out from server'),
        error: (err) => console.error('Logout error:', err)
      });
    }

    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiry');

    // Clear current user
    this.currentUserSubject.next(null);

    // Navigate to login
    this.router.navigate(['/login']);
  }

  /**
   * Get current user from memory - User Story 1.2: Role-Based Access
   * @returns Current user object or null
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Get authentication token
   * @returns JWT token or null
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated - User Story 1.1
   * @returns True if user is logged in and token is valid
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();
    const expiry = localStorage.getItem('tokenExpiry');

    if (!user || !token) {
      return false;
    }

    // Check token expiry
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        this.logout(); // Token expired, logout
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has specific role - User Story 1.2: Role-Based Dashboard Access
   * @param requiredRole - Role to check
   * @returns True if user has the required role
   */
  hasRole(requiredRole: User['role']): boolean {
    const user = this.getCurrentUser();
    return user?.role === requiredRole;
  }

  /**
   * Check if user has any of the specified roles - User Story 1.2
   * @param roles - Array of roles to check
   * @returns True if user has any of the roles
   */
  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
  }

  /**
   * Get user role - User Story 1.2
   * @returns User's role or null
   */
  getUserRole(): User['role'] | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /**
   * Get user facility ID - User Story 1.2
   * @returns User's facilityId or 'NATIONAL' for government officials
   */
  getFacilityId(): string {
    const user = this.getCurrentUser();
    
    // Government officials don't have a specific facility, they oversee all facilities
    if (user?.role === 'GOVERNMENT_OFFICIAL') {
      return 'NATIONAL';
    }
    
    // Return the user's facilityId or default to 'FAC001' for testing
    return user?.facilityId || 'FAC001';
  }

  /**
   * Check if user is a government official
   * @returns True if user is government official
   */
  isGovernmentOfficial(): boolean {
    return this.hasRole('GOVERNMENT_OFFICIAL');
  }

  /**
   * Check if user is a facility manager
   * @returns True if user is facility manager
   */
  isFacilityManager(): boolean {
    return this.hasRole('FACILITY_MANAGER');
  }

  /**
   * Check if user is a health worker
   * @returns True if user is health worker
   */
  isHealthWorker(): boolean {
    return this.hasRole('HEALTH_WORKER');
  }

  /**
   * Get user display name
   * @returns User's full name or username
   */
  getUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.fullName || user?.username || 'User';
  }

  /**
   * Update user profile
   * @param userData - Updated user data
   */
  updateUserProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData)
      .pipe(
        tap(updatedUser => {
          const currentUser = this.getCurrentUser();
          if (currentUser) {
            const mergedUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('currentUser', JSON.stringify(mergedUser));
            this.currentUserSubject.next(mergedUser);
          }
        }),
        catchError(error => throwError(() => error))
      );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    const token = this.getToken();
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { token })
      .pipe(
        tap(response => this.handleLoginSuccess(response)),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }
}
