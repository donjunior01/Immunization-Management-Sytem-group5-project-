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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:loadRememberedCredentials',message:'Loading remembered credentials',data:{hasRememberMe:localStorage.getItem('rememberMe')==='true'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
    // #endregion
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe) {
      const savedUsername = localStorage.getItem('savedUsername');
      const savedPassword = localStorage.getItem('savedPassword');
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:loadRememberedCredentials',message:'Found remembered credentials',data:{hasUsername:!!savedUsername,hasPassword:!!savedPassword},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
      // #endregion
      
      if (savedUsername && savedPassword) {
        this.loginForm.patchValue({
          usernameOrEmail: savedUsername,
          password: savedPassword
        });
        this.rememberMe = true;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:loadRememberedCredentials',message:'Credentials loaded into form',data:{rememberMe:this.rememberMe},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
        // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:onSubmit',message:'Storing remember me preference',data:{rememberMe:this.rememberMe,hasUsername:!!credentials.usernameOrEmail,hasPassword:!!credentials.password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
      // #endregion
      if (this.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        if (credentials.usernameOrEmail) {
          localStorage.setItem('savedUsername', credentials.usernameOrEmail);
        }
        if (credentials.password) {
          localStorage.setItem('savedPassword', credentials.password);
        }
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:onSubmit',message:'Credentials saved to localStorage',data:{rememberMe:localStorage.getItem('rememberMe'),hasUsername:!!localStorage.getItem('savedUsername'),hasPassword:!!localStorage.getItem('savedPassword')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
        // #endregion
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:onSubmit',message:'Credentials removed from localStorage',data:{rememberMe:localStorage.getItem('rememberMe')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'REMEMBER_ME'})}).catch(()=>{});
        // #endregion
      }

      this.authService.login(credentials, this.rememberMe).subscribe({
        next: (response) => {
          // Keep loader visible for 300ms, then redirect
          // Use the response user directly to avoid timing issues
          setTimeout(() => {
            this.loading = false;
            this.redirectToDashboardWithUser(response.user);
          }, 300);
        },
        error: (error) => {
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
            this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
          } else {
            this.errorMessage = 'An error occurred during login. Please try again.';
          }
          this.showError = true;
          console.error('Login error:', error);
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:102',message:'redirectToDashboardWithUser called',data:{hasUser:!!user,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:128',message:'Dashboard route determined',data:{role,dashboardRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    console.log('Redirecting to:', dashboardRoute, 'for role:', role, 'User:', user);

    // Use setTimeout to ensure guards are ready
    setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:132',message:'Attempting navigation',data:{dashboardRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      this.router.navigate([dashboardRoute], { replaceUrl: true }).then(
        (success) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:134',message:'Navigation result',data:{success,dashboardRoute},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          if (success) {
            console.log('Successfully navigated to:', dashboardRoute);
          } else {
            console.error('Navigation failed to:', dashboardRoute, 'User role:', role);
            // Try alternative route or show error
            this.handleNavigationFailure(role, dashboardRoute);
          }
        }
      ).catch(error => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:156',message:'Navigation error caught',data:{error:error?.message||String(error),errorType:error?.constructor?.name,errorStack:error?.stack?.substring(0,500),dashboardRoute,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CHUNK_LOAD'})}).catch(()=>{});
        // #endregion

        console.error('Navigation error:', error);

        // Check if it's a chunk loading error
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('chunk') || errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'login.component.ts:165',message:'Chunk loading error detected',data:{errorMessage,dashboardRoute,devServerRunning:typeof window!=='undefined'&&window.location?.hostname==='localhost'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CHUNK_LOAD'})}).catch(()=>{});
          // #endregion

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

