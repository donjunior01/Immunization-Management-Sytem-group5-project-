import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MyProfileComponent } from './my-profile.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

describe('MyProfileComponent', () => {
  let component: MyProfileComponent;
  let fixture: ComponentFixture<MyProfileComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    id: '1',
    username: 'John Doe',
    email: 'john.doe@example.com',
    role: 'FACILITY_MANAGER',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    facilityName: 'Test Facility',
    department: 'Administration',
    jobTitle: 'Senior Manager',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    bio: 'Experienced facility manager',
    avatar: '',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-01-15T00:00:00Z'
  };

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authSpy.getCurrentUser.and.returnValue(mockUser);

    await TestBed.configureTestingModule({
      imports: [MyProfileComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyProfileComponent);
    component = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on construction', () => {
    expect(component.profileForm).toBeDefined();
    expect(component.passwordForm).toBeDefined();
    expect(component.activitySummary).toBeDefined();
  });

  it('should load user profile on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.currentUser).toBeTruthy();
      expect(component.currentUser?.email).toBe('john.doe@example.com');
      expect(component.profileForm.get('firstName')?.value).toBe('John');
      expect(component.profileForm.get('lastName')?.value).toBe('Doe');
      done();
    }, 1100);
  });

  it('should disable role and facilityName fields', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.profileForm.get('role')?.disabled).toBeTrue();
      expect(component.profileForm.get('facilityName')?.disabled).toBeTrue();
      done();
    }, 1100);
  });

  it('should load activity summary', (done) => {
    component.loadActivitySummary();

    setTimeout(() => {
      expect(component.activitySummary.totalActions).toBeGreaterThan(0);
      expect(component.activitySummary.actionsThisWeek).toBeGreaterThan(0);
      done();
    }, 600);
  });

  it('should load recent activities', (done) => {
    component.loadRecentActivities();

    setTimeout(() => {
      expect(component.recentActivities.length).toBeGreaterThan(0);
      expect(component.recentActivities[0]).toHaveProperty('action');
      expect(component.recentActivities[0]).toHaveProperty('timestamp');
      done();
    }, 600);
  });

  it('should validate profile form - required fields', () => {
    component.profileForm.patchValue({
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    });

    expect(component.profileForm.invalid).toBeTrue();
    expect(component.profileForm.get('firstName')?.hasError('required')).toBeTrue();
    expect(component.profileForm.get('lastName')?.hasError('required')).toBeTrue();
    expect(component.profileForm.get('email')?.hasError('required')).toBeTrue();
    expect(component.profileForm.get('phone')?.hasError('required')).toBeTrue();
  });

  it('should validate email format', () => {
    component.profileForm.get('email')?.setValue('invalid-email');
    expect(component.profileForm.get('email')?.hasError('email')).toBeTrue();

    component.profileForm.get('email')?.setValue('valid@email.com');
    expect(component.profileForm.get('email')?.hasError('email')).toBeFalse();
  });

  it('should validate phone pattern', () => {
    component.profileForm.get('phone')?.setValue('abc123');
    expect(component.profileForm.get('phone')?.hasError('pattern')).toBeTrue();

    component.profileForm.get('phone')?.setValue('+1234567890');
    expect(component.profileForm.get('phone')?.hasError('pattern')).toBeFalse();
  });

  it('should validate ZIP code pattern', () => {
    component.profileForm.get('zipCode')?.setValue('abc');
    expect(component.profileForm.get('zipCode')?.hasError('pattern')).toBeTrue();

    component.profileForm.get('zipCode')?.setValue('12345');
    expect(component.profileForm.get('zipCode')?.hasError('pattern')).toBeFalse();

    component.profileForm.get('zipCode')?.setValue('12345-6789');
    expect(component.profileForm.get('zipCode')?.hasError('pattern')).toBeFalse();
  });

  it('should validate bio max length', () => {
    const longBio = 'a'.repeat(501);
    component.profileForm.get('bio')?.setValue(longBio);
    expect(component.profileForm.get('bio')?.hasError('maxlength')).toBeTrue();

    component.profileForm.get('bio')?.setValue('Valid bio');
    expect(component.profileForm.get('bio')?.hasError('maxlength')).toBeFalse();
  });

  it('should update profile successfully', (done) => {
    component.currentUser = mockUser as any;
    component.profileForm.patchValue({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+9876543210'
    });

    const setItemSpy = spyOn(localStorage, 'setItem');
    component.updateProfile();

    setTimeout(() => {
      expect(setItemSpy).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Profile updated successfully');
      expect(component.isEditMode).toBeFalse();
      done();
    }, 1100);
  });

  it('should not update profile with invalid form', () => {
    component.profileForm.patchValue({
      firstName: '',
      email: 'invalid-email'
    });

    component.updateProfile();

    expect(notificationService.error).toHaveBeenCalledWith('Please fill all required fields correctly');
  });

  it('should mark all controls as touched when update fails', () => {
    component.profileForm.patchValue({ firstName: '' });
    const markAsTouchedSpy = spyOn(component.profileForm.get('firstName')!, 'markAsTouched');

    component.updateProfile();

    expect(markAsTouchedSpy).toHaveBeenCalled();
  });

  it('should validate password form - required fields', () => {
    component.passwordForm.patchValue({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    expect(component.passwordForm.invalid).toBeTrue();
    expect(component.passwordForm.get('currentPassword')?.hasError('required')).toBeTrue();
    expect(component.passwordForm.get('newPassword')?.hasError('required')).toBeTrue();
    expect(component.passwordForm.get('confirmPassword')?.hasError('required')).toBeTrue();
  });

  it('should validate password minimum length', () => {
    component.passwordForm.get('newPassword')?.setValue('short');
    expect(component.passwordForm.get('newPassword')?.hasError('minlength')).toBeTrue();

    component.passwordForm.get('newPassword')?.setValue('LongPassword123!');
    expect(component.passwordForm.get('newPassword')?.hasError('minlength')).toBeFalse();
  });

  it('should validate password pattern', () => {
    component.passwordForm.get('newPassword')?.setValue('weakpassword');
    expect(component.passwordForm.get('newPassword')?.hasError('pattern')).toBeTrue();

    component.passwordForm.get('newPassword')?.setValue('StrongPass123!');
    expect(component.passwordForm.get('newPassword')?.hasError('pattern')).toBeFalse();
  });

  it('should validate password match', () => {
    component.passwordForm.patchValue({
      newPassword: 'Password123!',
      confirmPassword: 'DifferentPass123!'
    });

    expect(component.passwordForm.hasError('passwordMismatch')).toBeTrue();

    component.passwordForm.patchValue({
      newPassword: 'Password123!',
      confirmPassword: 'Password123!'
    });

    expect(component.passwordForm.hasError('passwordMismatch')).toBeFalse();
  });

  it('should change password successfully', (done) => {
    component.passwordForm.patchValue({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!'
    });

    component.changePassword();

    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Password changed successfully');
      expect(component.passwordForm.pristine).toBeTrue();
      expect(component.hideCurrentPassword).toBeTrue();
      expect(component.hideNewPassword).toBeTrue();
      expect(component.hideConfirmPassword).toBeTrue();
      done();
    }, 1100);
  });

  it('should not change password with invalid form', () => {
    component.passwordForm.patchValue({
      currentPassword: '',
      newPassword: 'weak',
      confirmPassword: 'different'
    });

    component.changePassword();

    expect(notificationService.error).toHaveBeenCalled();
  });

  it('should show password mismatch error', () => {
    component.passwordForm.patchValue({
      currentPassword: 'Current123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'DifferentPass123!'
    });

    component.changePassword();

    expect(notificationService.error).toHaveBeenCalledWith('New password and confirm password do not match');
  });

  it('should calculate password strength', () => {
    component.passwordForm.get('newPassword')?.setValue('weak');
    component.calculatePasswordStrength();
    expect(component.passwordStrength).toBeLessThan(40);

    component.passwordForm.get('newPassword')?.setValue('Medium123');
    component.calculatePasswordStrength();
    expect(component.passwordStrength).toBeGreaterThanOrEqual(40);
    expect(component.passwordStrength).toBeLessThan(70);

    component.passwordForm.get('newPassword')?.setValue('StrongPassword123!');
    component.calculatePasswordStrength();
    expect(component.passwordStrength).toBeGreaterThanOrEqual(70);
  });

  it('should return correct password strength color', () => {
    component.passwordStrength = 30;
    expect(component.getPasswordStrengthColor()).toBe('warn');

    component.passwordStrength = 50;
    expect(component.getPasswordStrengthColor()).toBe('accent');

    component.passwordStrength = 80;
    expect(component.getPasswordStrengthColor()).toBe('primary');
  });

  it('should return correct password strength label', () => {
    component.passwordStrength = 30;
    expect(component.getPasswordStrengthLabel()).toBe('Weak');

    component.passwordStrength = 50;
    expect(component.getPasswordStrengthLabel()).toBe('Medium');

    component.passwordStrength = 80;
    expect(component.getPasswordStrengthLabel()).toBe('Strong');
  });

  it('should handle file selection', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as any;
    const readerSpy = jasmine.createSpyObj('FileReader', ['readAsDataURL']);

    spyOn(window as any, 'FileReader').and.returnValue(readerSpy);

    component.onFileSelected(event);

    expect(component.selectedFile).toBe(file);
  });

  it('should reject non-image files', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;

    component.onFileSelected(event);

    expect(notificationService.error).toHaveBeenCalledWith('Please select a valid image file');
    expect(component.selectedFile).toBeNull();
  });

  it('should reject large files', () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    const event = { target: { files: [largeFile] } } as any;

    component.onFileSelected(event);

    expect(notificationService.error).toHaveBeenCalledWith('Image size must be less than 5MB');
  });

  it('should remove avatar', () => {
    component.currentUser = mockUser as any;
    component.imagePreview = 'data:image/jpeg;base64,abc123';

    component.removeAvatar();

    expect(component.selectedFile).toBeNull();
    expect(component.imagePreview).toBeNull();
    expect(component.currentUser?.avatar).toBe('');
    expect(notificationService.info).toHaveBeenCalledWith('Avatar removed');
  });

  it('should toggle edit mode', () => {
    component.isEditMode = false;
    component.toggleEditMode();
    expect(component.isEditMode).toBeTrue();

    component.isEditMode = true;
    spyOn(component, 'loadUserProfile');
    component.toggleEditMode();
    expect(component.isEditMode).toBeFalse();
    expect(component.loadUserProfile).toHaveBeenCalled();
  });

  it('should cancel profile changes', () => {
    spyOn(component, 'loadUserProfile');
    component.isEditMode = true;

    component.cancelProfileChanges();

    expect(component.loadUserProfile).toHaveBeenCalled();
    expect(component.isEditMode).toBeFalse();
    expect(component.selectedFile).toBeNull();
    expect(notificationService.info).toHaveBeenCalledWith('Changes cancelled');
  });

  it('should cancel password changes', () => {
    component.passwordForm.patchValue({
      currentPassword: 'test',
      newPassword: 'test',
      confirmPassword: 'test'
    });
    component.hideCurrentPassword = false;
    component.passwordStrength = 50;

    component.cancelPasswordChanges();

    expect(component.passwordForm.pristine).toBeTrue();
    expect(component.hideCurrentPassword).toBeTrue();
    expect(component.hideNewPassword).toBeTrue();
    expect(component.hideConfirmPassword).toBeTrue();
    expect(component.passwordStrength).toBe(0);
    expect(notificationService.info).toHaveBeenCalledWith('Password change cancelled');
  });

  it('should export profile', () => {
    component.currentUser = mockUser as any;
    const createElementSpy = spyOn(document, 'createElement').and.returnValue({
      click: jasmine.createSpy('click'),
      href: '',
      download: ''
    } as any);
    const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    const revokeObjectURLSpy = spyOn(window.URL, 'revokeObjectURL');

    component.exportProfile();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Profile exported successfully');
  });

  it('should deactivate account with confirmation', (done) => {
    spyOn(window, 'confirm').and.returnValue(true);

    component.deactivateAccount();

    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Account deactivated successfully');
      setTimeout(() => {
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 2100);
    }, 1100);
  });

  it('should cancel deactivate account', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deactivateAccount();

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should delete account with double confirmation', (done) => {
    spyOn(window, 'confirm').and.returnValues(true, true);

    component.deleteAccount();

    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Account deletion request submitted');
      setTimeout(() => {
        expect(authService.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        done();
      }, 2100);
    }, 1100);
  });

  it('should cancel delete account on first prompt', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.deleteAccount();

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should cancel delete account on second prompt', () => {
    spyOn(window, 'confirm').and.returnValues(true, false);

    component.deleteAccount();

    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should get initials from user name', () => {
    component.currentUser = mockUser as any;
    expect(component.getInitials()).toBe('JD');

    component.currentUser = null;
    expect(component.getInitials()).toBe('');
  });

  it('should get role color based on role', () => {
    component.currentUser = { ...mockUser, role: 'ADMIN' } as any;
    expect(component.getRoleColor()).toBe('warn');

    component.currentUser = { ...mockUser, role: 'FACILITY_MANAGER' } as any;
    expect(component.getRoleColor()).toBe('accent');

    component.currentUser = { ...mockUser, role: 'WORKER' } as any;
    expect(component.getRoleColor()).toBe('primary');
  });

  it('should get role icon based on role', () => {
    component.currentUser = { ...mockUser, role: 'ADMIN' } as any;
    expect(component.getRoleIcon()).toBe('admin_panel_settings');

    component.currentUser = { ...mockUser, role: 'FACILITY_MANAGER' } as any;
    expect(component.getRoleIcon()).toBe('business');

    component.currentUser = { ...mockUser, role: 'HEALTH_WORKER' } as any;
    expect(component.getRoleIcon()).toBe('local_hospital');

    component.currentUser = { ...mockUser, role: 'GOVERNMENT_OFFICIAL' } as any;
    expect(component.getRoleIcon()).toBe('account_balance');

    component.currentUser = { ...mockUser, role: 'USER' } as any;
    expect(component.getRoleIcon()).toBe('person');
  });

  it('should format date correctly', () => {
    const dateString = '2024-01-15T00:00:00Z';
    const formatted = component.formatDate(dateString);
    expect(formatted).toContain('2024');
    expect(formatted).toContain('January');
  });

  it('should get field error messages', () => {
    component.profileForm.get('firstName')?.markAsTouched();
    component.profileForm.get('firstName')?.setErrors({ required: true });
    expect(component.getFieldError(component.profileForm, 'firstName')).toBe('First name is required');

    component.profileForm.get('email')?.markAsTouched();
    component.profileForm.get('email')?.setErrors({ email: true });
    expect(component.getFieldError(component.profileForm, 'email')).toBe('Invalid email format');

    component.profileForm.get('bio')?.markAsTouched();
    component.profileForm.get('bio')?.setErrors({ maxlength: { requiredLength: 500 } });
    expect(component.getFieldError(component.profileForm, 'bio')).toBe('Maximum 500 characters allowed');

    component.profileForm.get('phone')?.markAsTouched();
    component.profileForm.get('phone')?.setErrors({ pattern: true });
    expect(component.getFieldError(component.profileForm, 'phone')).toBe('Invalid phone number format');

    component.passwordForm.get('newPassword')?.markAsTouched();
    component.passwordForm.get('newPassword')?.setErrors({ pattern: true });
    expect(component.getFieldError(component.passwordForm, 'newPassword')).toContain('Password must contain');
  });

  it('should return empty string for field without errors', () => {
    expect(component.getFieldError(component.profileForm, 'firstName')).toBe('');
  });

  it('should get field labels', () => {
    expect(component.getFieldLabel('firstName')).toBe('First name');
    expect(component.getFieldLabel('email')).toBe('Email');
    expect(component.getFieldLabel('unknownField')).toBe('unknownField');
  });
});
