import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Added for checkbox

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule // Added for rememberMe
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Load saved credentials if "Remember Me" was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';

    this.loginForm = this.fb.group({
      username: [savedUsername || '', [Validators.required, Validators.minLength(3)]],
      password: [savedPassword || '', [Validators.required, Validators.minLength(8)]], // US 1: Password ≥8 chars
      rememberMe: [rememberMe] // Load saved preference
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { username, password, rememberMe } = this.loginForm.value;

      // Handle "Remember Me" functionality
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedUsername');
        localStorage.removeItem('rememberedPassword');
        localStorage.removeItem('rememberMe');
      }

      this.authService.login(username, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Redirect to role-specific dashboard
          const userRole = response.user.role;
          const dashboardRoute = this.getDashboardRouteForRole(userRole);
          this.router.navigate([dashboardRoute]);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Login failed. Please try again.';
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  onForgotPassword(): void {
    // Placeholder: Implement logic to show a dialog or navigate to reset page
    alert('Forgot Password? Feature coming soon!'); // Replace with actual implementation
  }

  private getDashboardRouteForRole(role: string): string {
    switch (role) {
      case 'HEALTH_WORKER':
        return '/dashboard/health-worker';
      case 'FACILITY_MANAGER':
        return '/dashboard/facility-manager';
      case 'GOVERNMENT_OFFICIAL':
        return '/dashboard/government-official';
      default:
        return '/dashboard/health-worker'; // Default fallback
    }
  }
}
