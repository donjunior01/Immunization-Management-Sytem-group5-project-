import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  facilityName: string;
  role: string;
  department?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

interface ActivitySummary {
  totalActions: number;
  lastAction: string;
  actionsThisWeek: number;
  actionsThisMonth: number;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss']
})
export class MyProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: UserProfile | null = null;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  activitySummary: ActivitySummary;
  recentActivities: RecentActivity[] = [];
  isEditMode = false;
  passwordStrength = 0;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.activitySummary = {
      totalActions: 0,
      lastAction: '',
      actionsThisWeek: 0,
      actionsThisMonth: 0
    };

    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      facilityName: [''],
      role: [''],
      department: [''],
      jobTitle: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: ['', Validators.pattern(/^\d{5}(-\d{4})?$/)],
      bio: ['', Validators.maxLength(500)]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loaderService.show();
    this.loadUserProfile();
    this.loadActivitySummary();
    this.loadRecentActivities();
  }

  loadUserProfile(): void {
    setTimeout(() => {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.currentUser = {
          id: user.id || '1',
          firstName: (user as any).firstName || user.username?.split(' ')[0] || '',
          lastName: (user as any).lastName || user.username?.split(' ')[1] || '',
          email: user.email || '',
          phone: (user as any).phone || '',
          facilityName: (user as any).facilityName || 'N/A',
          role: user.role || '',
          department: (user as any).department || '',
          jobTitle: (user as any).jobTitle || '',
          address: (user as any).address || '',
          city: (user as any).city || '',
          state: (user as any).state || '',
          zipCode: (user as any).zipCode || '',
          bio: (user as any).bio || '',
          avatar: (user as any).avatar || '',
          createdAt: (user as any).createdAt || new Date().toISOString(),
          lastLogin: (user as any).lastLogin || new Date().toISOString()
        };

        this.profileForm.patchValue({
          firstName: this.currentUser.firstName,
          lastName: this.currentUser.lastName,
          email: this.currentUser.email,
          phone: this.currentUser.phone,
          facilityName: this.currentUser.facilityName,
          role: this.currentUser.role,
          department: this.currentUser.department || '',
          jobTitle: this.currentUser.jobTitle || '',
          address: this.currentUser.address || '',
          city: this.currentUser.city || '',
          state: this.currentUser.state || '',
          zipCode: this.currentUser.zipCode || '',
          bio: this.currentUser.bio || ''
        });

        // Disable role and facilityName (read-only)
        this.profileForm.get('role')?.disable();
        this.profileForm.get('facilityName')?.disable();

        if (this.currentUser.avatar) {
          this.imagePreview = this.currentUser.avatar;
        }
      }
    }, 1000);
  }

  loadActivitySummary(): void {
    setTimeout(() => {
      this.activitySummary = {
        totalActions: 1247,
        lastAction: '2 hours ago',
        actionsThisWeek: 87,
        actionsThisMonth: 342
      };
    }, 500);
  }

  loadRecentActivities(): void {
    setTimeout(() => {
      this.recentActivities = [
        {
          id: '1',
          action: 'Profile Update',
          timestamp: '2 hours ago',
          description: 'Updated contact information',
          icon: 'edit'
        },
        {
          id: '2',
          action: 'Password Changed',
          timestamp: '1 day ago',
          description: 'Changed account password',
          icon: 'lock'
        },
        {
          id: '3',
          action: 'Inventory Added',
          timestamp: '3 days ago',
          description: 'Added 5 vaccine batches',
          icon: 'add_box'
        },
        {
          id: '4',
          action: 'Report Generated',
          timestamp: '5 days ago',
          description: 'Generated monthly inventory report',
          icon: 'description'
        },
        {
          id: '5',
          action: 'Settings Updated',
          timestamp: '1 week ago',
          description: 'Modified notification preferences',
          icon: 'settings'
        }
      ];
    }, 500);
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Image size must be less than 5MB');
        return;
      }

      this.selectedFile = file;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeAvatar(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    if (this.currentUser) {
      this.currentUser.avatar = '';
    }
    this.notificationService.info('Avatar removed');
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.loadUserProfile();
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        const control = this.profileForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      if (this.currentUser) {
        const updatedUser: UserProfile = {
          ...this.currentUser,
          ...this.profileForm.getRawValue(),
          avatar: this.imagePreview || this.currentUser.avatar || ''
        };
        
        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;
        this.isEditMode = false;
        
        this.notificationService.success('Profile updated successfully');
      }
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.errors?.['passwordMismatch']) {
        this.notificationService.error('New password and confirm password do not match');
      } else {
        Object.keys(this.passwordForm.controls).forEach(key => {
          const control = this.passwordForm.get(key);
          control?.markAsTouched();
        });
        this.notificationService.error('Please fill all password fields correctly');
      }
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      // In a real application, this would call the backend API
      this.passwordForm.reset();
      this.hideCurrentPassword = true;
      this.hideNewPassword = true;
      this.hideConfirmPassword = true;
      this.passwordStrength = 0;
      this.notificationService.success('Password changed successfully');
    }, 1000);
  }

  calculatePasswordStrength(): void {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[@$!%*?&]/.test(password)) strength += 10;

    this.passwordStrength = Math.min(strength, 100);
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength < 40) return 'warn';
    if (this.passwordStrength < 70) return 'accent';
    return 'primary';
  }

  getPasswordStrengthLabel(): string {
    if (this.passwordStrength < 40) return 'Weak';
    if (this.passwordStrength < 70) return 'Medium';
    return 'Strong';
  }

  cancelProfileChanges(): void {
    this.loadUserProfile();
    this.isEditMode = false;
    this.selectedFile = null;
    this.notificationService.info('Changes cancelled');
  }

  cancelPasswordChanges(): void {
    this.passwordForm.reset();
    this.hideCurrentPassword = true;
    this.hideNewPassword = true;
    this.hideConfirmPassword = true;
    this.passwordStrength = 0;
    this.notificationService.info('Password change cancelled');
  }

  exportProfile(): void {
    if (!this.currentUser) return;

    const profileData = {
      profile: this.currentUser,
      activitySummary: this.activitySummary,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile_${this.currentUser.firstName}_${this.currentUser.lastName}_${new Date().getTime()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.success('Profile exported successfully');
  }

  deactivateAccount(): void {
    if (!confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.notificationService.success('Account deactivated successfully');
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    }, 1000);
  }

  deleteAccount(): void {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      // In a real application, this would call the backend API
      this.notificationService.success('Account deletion request submitted');
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2000);
    }, 1000);
  }

  getInitials(): string {
    if (!this.currentUser) return '';
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getRoleColor(): string {
    if (!this.currentUser?.role) return 'primary';
    const role = this.currentUser.role.toLowerCase();
    if (role.includes('admin')) return 'warn';
    if (role.includes('manager')) return 'accent';
    return 'primary';
  }

  getRoleIcon(): string {
    if (!this.currentUser?.role) return 'person';
    const role = this.currentUser.role.toLowerCase();
    if (role.includes('admin')) return 'admin_panel_settings';
    if (role.includes('manager')) return 'business';
    if (role.includes('worker')) return 'local_hospital';
    if (role.includes('official')) return 'account_balance';
    return 'person';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (control.errors['email']) return 'Invalid email format';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    if (control.errors['pattern']) {
      if (fieldName === 'phone') return 'Invalid phone number format';
      if (fieldName === 'zipCode') return 'Invalid ZIP code format';
      if (fieldName === 'newPassword') return 'Password must contain uppercase, lowercase, number, and special character';
    }

    return 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      department: 'Department',
      jobTitle: 'Job title',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP code',
      bio: 'Bio',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password'
    };
    return labels[fieldName] || fieldName;
  }
}
