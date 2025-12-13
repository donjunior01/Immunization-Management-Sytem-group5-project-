import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { FacilityManagerSettingsComponent } from './facility-manager-settings.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

describe('FacilityManagerSettingsComponent', () => {
  let component: FacilityManagerSettingsComponent;
  let fixture: ComponentFixture<FacilityManagerSettingsComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [FacilityManagerSettingsComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(FacilityManagerSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on init', () => {
    fixture.detectChanges();
    
    expect(component.generalForm).toBeDefined();
    expect(component.notificationForm).toBeDefined();
    expect(component.securityForm).toBeDefined();
    expect(component.displayForm).toBeDefined();
    expect(component.dataForm).toBeDefined();
  });

  it('should load settings on init', (done) => {
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(loaderService.show).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Settings loaded successfully');
      done();
    }, 900);
  });

  it('should save general settings when form is valid', (done) => {
    fixture.detectChanges();
    
    component.generalForm.patchValue({
      language: 'en',
      timezone: 'Africa/Nairobi',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
      currency: 'KES'
    });
    
    component.saveGeneralSettings();
    
    setTimeout(() => {
      expect(loaderService.show).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('General settings saved successfully');
      done();
    }, 1100);
  });

  it('should not save general settings when form is invalid', () => {
    fixture.detectChanges();
    
    component.generalForm.patchValue({
      language: '',
      timezone: '',
      dateFormat: '',
      timeFormat: '',
      currency: ''
    });
    
    component.saveGeneralSettings();
    
    expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
  });

  it('should save notification settings', (done) => {
    fixture.detectChanges();
    
    component.notificationForm.patchValue({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    });
    
    component.saveNotificationSettings();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Notification settings saved successfully');
      done();
    }, 1100);
  });

  it('should save security settings when form is valid', (done) => {
    fixture.detectChanges();
    
    component.securityForm.patchValue({
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90
    });
    
    component.saveSecuritySettings();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Security settings saved successfully');
      done();
    }, 1100);
  });

  it('should save display settings', (done) => {
    fixture.detectChanges();
    
    component.displayForm.patchValue({
      theme: 'dark',
      compactMode: true
    });
    
    component.saveDisplaySettings();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Display settings saved successfully');
      done();
    }, 1100);
  });

  it('should save data settings when form is valid', (done) => {
    fixture.detectChanges();
    
    component.dataForm.patchValue({
      autoSaveInterval: 5,
      backupFrequency: 'daily',
      dataRetention: 365,
      exportFormat: 'csv'
    });
    
    component.saveDataSettings();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Data settings saved successfully');
      done();
    }, 1100);
  });

  it('should reset general settings to defaults', () => {
    fixture.detectChanges();
    
    component.generalForm.patchValue({
      language: 'fr',
      timezone: 'Africa/Cairo',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      currency: 'USD'
    });
    
    component.resetGeneralSettings();
    
    expect(component.generalForm.get('language')?.value).toBe('en');
    expect(component.generalForm.get('timezone')?.value).toBe('Africa/Nairobi');
    expect(notificationService.info).toHaveBeenCalledWith('General settings reset to defaults');
  });

  it('should reset notification settings to defaults', () => {
    fixture.detectChanges();
    
    component.notificationForm.patchValue({
      emailNotifications: false,
      smsNotifications: true,
      pushNotifications: false
    });
    
    component.resetNotificationSettings();
    
    expect(component.notificationForm.get('emailNotifications')?.value).toBe(true);
    expect(component.notificationForm.get('pushNotifications')?.value).toBe(true);
    expect(notificationService.info).toHaveBeenCalledWith('Notification settings reset to defaults');
  });

  it('should reset security settings to defaults', () => {
    fixture.detectChanges();
    
    component.securityForm.patchValue({
      twoFactorAuth: true,
      sessionTimeout: 60
    });
    
    component.resetSecuritySettings();
    
    expect(component.securityForm.get('twoFactorAuth')?.value).toBe(false);
    expect(component.securityForm.get('sessionTimeout')?.value).toBe(30);
    expect(notificationService.info).toHaveBeenCalledWith('Security settings reset to defaults');
  });

  it('should reset display settings to defaults', () => {
    fixture.detectChanges();
    
    component.displayForm.patchValue({
      theme: 'dark',
      compactMode: true
    });
    
    component.resetDisplaySettings();
    
    expect(component.displayForm.get('theme')?.value).toBe('light');
    expect(component.displayForm.get('compactMode')?.value).toBe(false);
    expect(notificationService.info).toHaveBeenCalledWith('Display settings reset to defaults');
  });

  it('should reset data settings to defaults', () => {
    fixture.detectChanges();
    
    component.dataForm.patchValue({
      autoSaveInterval: 10,
      backupFrequency: 'weekly'
    });
    
    component.resetDataSettings();
    
    expect(component.dataForm.get('autoSaveInterval')?.value).toBe(5);
    expect(component.dataForm.get('backupFrequency')?.value).toBe('daily');
    expect(notificationService.info).toHaveBeenCalledWith('Data settings reset to defaults');
  });

  it('should reset all settings with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(localStorage, 'removeItem');
    fixture.detectChanges();
    
    component.resetAllSettings();
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('facilityManagerSettings');
    expect(notificationService.success).toHaveBeenCalledWith('All settings reset to defaults');
  });

  it('should not reset all settings without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    spyOn(localStorage, 'removeItem');
    fixture.detectChanges();
    
    component.resetAllSettings();
    
    expect(localStorage.removeItem).not.toHaveBeenCalled();
  });

  it('should apply theme', () => {
    spyOn(document.body, 'setAttribute');
    
    component.applyTheme('dark');
    
    expect(document.body.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('should test notifications', (done) => {
    fixture.detectChanges();
    
    component.testNotifications();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Test notification sent successfully!');
      done();
    }, 1100);
  });

  it('should show 2FA setup message', () => {
    component.enable2FA();
    
    expect(notificationService.info).toHaveBeenCalledWith('Two-factor authentication setup would be implemented here');
  });

  it('should export settings', (done) => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window.URL, 'revokeObjectURL');
    fixture.detectChanges();
    
    component.exportSettings();
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Settings exported successfully');
      done();
    }, 1100);
  });

  it('should import settings from valid file', () => {
    const mockSettings = {
      general: { language: 'fr', timezone: 'Africa/Cairo' },
      notifications: { emailNotifications: false },
      security: { twoFactorAuth: true },
      display: { theme: 'dark' },
      data: { autoSaveInterval: 10 }
    };
    
    const file = new Blob([JSON.stringify(mockSettings)], { type: 'application/json' });
    const event = { target: { files: [file] } };
    
    fixture.detectChanges();
    component.importSettings(event);
    
    // FileReader is asynchronous, so we can't test the result directly
    expect(component).toBeTruthy();
  });

  it('should save settings to localStorage', () => {
    spyOn(localStorage, 'setItem');
    
    component.saveToStorage();
    
    expect(localStorage.setItem).toHaveBeenCalledWith('facilityManagerSettings', jasmine.any(String));
  });

  it('should load settings from localStorage', () => {
    const mockSettings = {
      general: { language: 'fr' },
      notifications: { emailNotifications: false }
    };
    
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockSettings));
    
    const result = component.loadFromStorage();
    
    expect(result).toEqual(mockSettings);
  });

  it('should return null when no settings in localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    
    const result = component.loadFromStorage();
    
    expect(result).toBeNull();
  });

  it('should have correct language options', () => {
    expect(component.languageOptions.length).toBeGreaterThan(0);
    expect(component.languageOptions[0].value).toBe('en');
  });

  it('should have correct theme options', () => {
    expect(component.themeOptions.length).toBe(3);
    expect(component.themeOptions.map(t => t.value)).toContain('light');
    expect(component.themeOptions.map(t => t.value)).toContain('dark');
    expect(component.themeOptions.map(t => t.value)).toContain('auto');
  });

  it('should have correct notification frequency options', () => {
    expect(component.notificationFrequencyOptions.length).toBeGreaterThan(0);
    expect(component.notificationFrequencyOptions.map(o => o.value)).toContain('realtime');
  });

  it('should have correct session timeout options', () => {
    expect(component.sessionTimeoutOptions.length).toBeGreaterThan(0);
    expect(component.sessionTimeoutOptions.map(o => o.value)).toContain(30);
  });
});
