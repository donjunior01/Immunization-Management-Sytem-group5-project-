import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User, LoginRequest } from '../../core/models/user.model';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, AlertComponent, LoaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showError = false;
  showPassword = false;
  rememberMe = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    } else {
      // Load remembered credentials if available
      this.loadRememberedCredentials();
    }
  }

  private loadRememberedCredentials(): void {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      const savedUsername = localStorage.getItem('savedUsername');
      const savedPassword = localStorage.getItem('savedPassword');
      
      if (savedUsername && savedPassword) {
        this.loginForm.patchValue({
          usernameOrEmail: savedUsername,
          password: savedPassword
        });
        this.rememberMe = true;
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.showError = false;
      this.errorMessage = '';

      const credentials: LoginRequest = {
        usernameOrEmail: this.loginForm.value.usernameOrEmail,
        username: this.loginForm.value.usernameOrEmail, // For compatibility
        password: this.loginForm.value.password
      };

      // Store remember me preference and credentials
      if (this.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        if (credentials.usernameOrEmail) {
          localStorage.setItem('savedUsername', credentials.usernameOrEmail);
        }
        if (credentials.password) {
          localStorage.setItem('savedPassword', credentials.password);
        }
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
      }

      this.authService.login(credentials, this.rememberMe).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          // Keep loader visible for 300ms, then redirect
          // Use the response user directly to avoid timing issues
          setTimeout(() => {
            this.loading = false;
            this.redirectToDashboardWithUser(response.user);
          }, 300);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.loading = false;
          // Handle different error response formats
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error?.error) {
            this.errorMessage = error.error.error;
          } else if (error.status === 403) {
            this.errorMessage = 'Access forbidden. Please check your credentials.';
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid username or password';
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check if the backend is running at http://localhost:8080/api';
          } else {
            this.errorMessage = 'An error occurred during login. Please try again.';
          }
          this.showError = true;
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  private redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    this.redirectToDashboardWithUser(user);
  }

  private redirectToDashboardWithUser(user: User | null): void {
    if (!user) {
      console.error('No user found after login');
      this.router.navigate(['/login']);
      return;
    }

    // Handle both frontend and backend role names
    const role = (user.role as string).toUpperCase();
    let dashboardRoute = '/login';

    // Map backend roles to dashboard routes
    if (role === 'GOVERNMENT_OFFICIAL') {
      dashboardRoute = '/district/dashboard';
    } else if (role === 'FACILITY_MANAGER') {
      dashboardRoute = '/manager/dashboard';
    } else if (role === 'HEALTH_WORKER') {
      dashboardRoute = '/vaccinator/dashboard';
    } else {
      console.warn('Unknown role:', role, 'User:', user);
      // Default fallback
      dashboardRoute = '/vaccinator/dashboard';
    }

    console.log('Redirecting to:', dashboardRoute, 'for role:', role, 'User:', user);

    // Use setTimeout to ensure guards are ready
    setTimeout(() => {
      this.router.navigate([dashboardRoute], { replaceUrl: true }).then(
        (success) => {
          if (success) {
            console.log('Successfully navigated to:', dashboardRoute);
          } else {
            console.error('Navigation failed to:', dashboardRoute, 'User role:', role);
            // Try alternative route or show error
            this.handleNavigationFailure(role, dashboardRoute);
          }
        }
      ).catch(error => {
        console.error('Navigation error:', error);

        // Check if it's a chunk loading error
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('chunk') || errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          console.error('Chunk loading error detected. This usually means:');
          console.error('1. Dev server is not running - please start with: ng serve');
          console.error('2. Build cache is corrupted - try: ng serve --delete-output-path');
          console.error('3. Component file path is incorrect');
        }

        this.handleNavigationFailure(role, dashboardRoute);
      });
    }, 100);
  }

  private handleNavigationFailure(role: string, attemptedRoute: string): void {
    console.error('Navigation failed for role:', role, 'Attempted route:', attemptedRoute);

    // Try fallback routes based on backend role
    let fallbackRoute = '/login';

    if (role === 'HEALTH_WORKER') {
      fallbackRoute = '/vaccinator/dashboard';
    } else if (role === 'FACILITY_MANAGER') {
      fallbackRoute = '/manager/dashboard';
    } else if (role === 'GOVERNMENT_OFFICIAL') {
      fallbackRoute = '/admin/dashboard';
    }

    // Try fallback route
    if (fallbackRoute !== attemptedRoute) {
      console.log('Trying fallback route:', fallbackRoute);
      this.router.navigate([fallbackRoute], { replaceUrl: true }).catch(err => {
        console.error('Fallback navigation also failed:', err);
        this.errorMessage = `Unable to navigate to dashboard. Please contact support. Role: ${role}`;
        this.showError = true;
      });
    } else {
      this.errorMessage = `Unable to navigate to dashboard. Please contact support. Role: ${role}`;
      this.showError = true;
    }
  }

  get usernameOrEmail() {
    return this.loginForm.get('usernameOrEmail');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onGoogleSignIn(): void {
    // Placeholder for Google OAuth integration
    console.log('Google sign-in clicked');
    // TODO: Implement Google OAuth
  }

  onForgotPassword(): void {
    // Placeholder for forgot password modal
    console.log('Forgot password clicked');
    // TODO: Implement forgot password modal
  }

  isMockMode(): boolean {
    return environment.useMockAuth === true;
  }

  fillDemoAccount(username: string, password: string): void {
    this.loginForm.patchValue({
      usernameOrEmail: username,
      password: password
    });
  }
}

