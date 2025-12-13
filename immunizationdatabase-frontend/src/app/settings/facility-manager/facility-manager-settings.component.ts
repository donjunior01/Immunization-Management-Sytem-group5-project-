import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lowStockAlerts: boolean;
  expiryAlerts: boolean;
  campaignReminders: boolean;
  systemUpdates: boolean;
  notificationFrequency: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
  trustedDevicesOnly: boolean;
}

interface DisplaySettings {
  theme: string;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  animationsEnabled: boolean;
  highContrast: boolean;
}

interface DataSettings {
  autoSaveInterval: number;
  backupFrequency: string;
  dataRetention: number;
  exportFormat: string;
}

@Component({
  selector: 'app-facility-manager-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './facility-manager-settings.component.html',
  styleUrl: './facility-manager-settings.component.scss'
})
export class FacilityManagerSettingsComponent implements OnInit {
  generalForm!: FormGroup;
  notificationForm!: FormGroup;
  securityForm!: FormGroup;
  displayForm!: FormGroup;
  dataForm!: FormGroup;

  generalSettings: GeneralSettings = {
    language: 'en',
    timezone: 'Africa/Nairobi',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    currency: 'KES'
  };

  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    lowStockAlerts: true,
    expiryAlerts: true,
    campaignReminders: true,
    systemUpdates: true,
    notificationFrequency: 'realtime'
  };

  securitySettings: SecuritySettings = {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    trustedDevicesOnly: false
  };

  displaySettings: DisplaySettings = {
    theme: 'light',
    sidebarCollapsed: false,
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true,
    highContrast: false
  };

  dataSettings: DataSettings = {
    autoSaveInterval: 5,
    backupFrequency: 'daily',
    dataRetention: 365,
    exportFormat: 'csv'
  };

  // Options
  languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Swahili' },
    { value: 'fr', label: 'French' }
  ];

  timezoneOptions = [
    { value: 'Africa/Nairobi', label: 'East Africa Time (EAT)' },
    { value: 'Africa/Lagos', label: 'West Africa Time (WAT)' },
    { value: 'Africa/Cairo', label: 'Eastern European Time (EET)' }
  ];

  dateFormatOptions = [
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' }
  ];

  timeFormatOptions = [
    { value: '12h', label: '12-hour (AM/PM)' },
    { value: '24h', label: '24-hour' }
  ];

  currencyOptions = [
    { value: 'KES', label: 'Kenyan Shilling (KES)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' }
  ];

  notificationFrequencyOptions = [
    { value: 'realtime', label: 'Real-time' },
    { value: 'hourly', label: 'Hourly Digest' },
    { value: 'daily', label: 'Daily Digest' },
    { value: 'weekly', label: 'Weekly Digest' }
  ];

  sessionTimeoutOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' }
  ];

  passwordExpiryOptions = [
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 0, label: 'Never' }
  ];

  themeOptions = [
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' },
    { value: 'auto', label: 'Auto', icon: 'brightness_auto' }
  ];

  autoSaveIntervalOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' }
  ];

  backupFrequencyOptions = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  dataRetentionOptions = [
    { value: 90, label: '90 days' },
    { value: 180, label: '180 days' },
    { value: 365, label: '1 year' },
    { value: 730, label: '2 years' },
    { value: 1825, label: '5 years' }
  ];

  exportFormatOptions = [
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (XLSX)' },
    { value: 'json', label: 'JSON' },
    { value: 'pdf', label: 'PDF' }
  ];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadSettings();
  }

  initializeForms(): void {
    this.generalForm = this.fb.group({
      language: [this.generalSettings.language, Validators.required],
      timezone: [this.generalSettings.timezone, Validators.required],
      dateFormat: [this.generalSettings.dateFormat, Validators.required],
      timeFormat: [this.generalSettings.timeFormat, Validators.required],
      currency: [this.generalSettings.currency, Validators.required]
    });

    this.notificationForm = this.fb.group({
      emailNotifications: [this.notificationSettings.emailNotifications],
      smsNotifications: [this.notificationSettings.smsNotifications],
      pushNotifications: [this.notificationSettings.pushNotifications],
      lowStockAlerts: [this.notificationSettings.lowStockAlerts],
      expiryAlerts: [this.notificationSettings.expiryAlerts],
      campaignReminders: [this.notificationSettings.campaignReminders],
      systemUpdates: [this.notificationSettings.systemUpdates],
      notificationFrequency: [this.notificationSettings.notificationFrequency]
    });

    this.securityForm = this.fb.group({
      twoFactorAuth: [this.securitySettings.twoFactorAuth],
      sessionTimeout: [this.securitySettings.sessionTimeout, Validators.required],
      passwordExpiry: [this.securitySettings.passwordExpiry, Validators.required],
      loginNotifications: [this.securitySettings.loginNotifications],
      trustedDevicesOnly: [this.securitySettings.trustedDevicesOnly]
    });

    this.displayForm = this.fb.group({
      theme: [this.displaySettings.theme],
      sidebarCollapsed: [this.displaySettings.sidebarCollapsed],
      compactMode: [this.displaySettings.compactMode],
      showTooltips: [this.displaySettings.showTooltips],
      animationsEnabled: [this.displaySettings.animationsEnabled],
      highContrast: [this.displaySettings.highContrast]
    });

    this.dataForm = this.fb.group({
      autoSaveInterval: [this.dataSettings.autoSaveInterval, Validators.required],
      backupFrequency: [this.dataSettings.backupFrequency, Validators.required],
      dataRetention: [this.dataSettings.dataRetention, Validators.required],
      exportFormat: [this.dataSettings.exportFormat, Validators.required]
    });
  }

  loadSettings(): void {
    this.loaderService.show(800);
    
    setTimeout(() => {
      // Load settings from localStorage or API
      const savedSettings = this.loadFromStorage();
      
      if (savedSettings) {
        this.generalSettings = { ...this.generalSettings, ...savedSettings.general };
        this.notificationSettings = { ...this.notificationSettings, ...savedSettings.notifications };
        this.securitySettings = { ...this.securitySettings, ...savedSettings.security };
        this.displaySettings = { ...this.displaySettings, ...savedSettings.display };
        this.dataSettings = { ...this.dataSettings, ...savedSettings.data };
        
        this.generalForm.patchValue(this.generalSettings);
        this.notificationForm.patchValue(this.notificationSettings);
        this.securityForm.patchValue(this.securitySettings);
        this.displayForm.patchValue(this.displaySettings);
        this.dataForm.patchValue(this.dataSettings);
      }
      
      this.notificationService.success('Settings loaded successfully');
    }, 800);
  }

  saveGeneralSettings(): void {
    if (this.generalForm.valid) {
      this.loaderService.show(1000);
      
      setTimeout(() => {
        this.generalSettings = this.generalForm.value;
        this.saveToStorage();
        this.notificationService.success('General settings saved successfully');
      }, 1000);
    } else {
      this.notificationService.error('Please fill in all required fields');
    }
  }

  saveNotificationSettings(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.notificationSettings = this.notificationForm.value;
      this.saveToStorage();
      this.notificationService.success('Notification settings saved successfully');
    }, 1000);
  }

  saveSecuritySettings(): void {
    if (this.securityForm.valid) {
      this.loaderService.show(1000);
      
      setTimeout(() => {
        this.securitySettings = this.securityForm.value;
        this.saveToStorage();
        this.notificationService.success('Security settings saved successfully');
      }, 1000);
    } else {
      this.notificationService.error('Please fill in all required fields');
    }
  }

  saveDisplaySettings(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.displaySettings = this.displayForm.value;
      this.applyTheme(this.displaySettings.theme);
      this.saveToStorage();
      this.notificationService.success('Display settings saved successfully');
    }, 1000);
  }

  saveDataSettings(): void {
    if (this.dataForm.valid) {
      this.loaderService.show(1000);
      
      setTimeout(() => {
        this.dataSettings = this.dataForm.value;
        this.saveToStorage();
        this.notificationService.success('Data settings saved successfully');
      }, 1000);
    } else {
      this.notificationService.error('Please fill in all required fields');
    }
  }

  saveToStorage(): void {
    const allSettings = {
      general: this.generalSettings,
      notifications: this.notificationSettings,
      security: this.securitySettings,
      display: this.displaySettings,
      data: this.dataSettings
    };
    
    localStorage.setItem('facilityManagerSettings', JSON.stringify(allSettings));
  }

  loadFromStorage(): any {
    const saved = localStorage.getItem('facilityManagerSettings');
    return saved ? JSON.parse(saved) : null;
  }

  resetGeneralSettings(): void {
    this.generalForm.reset({
      language: 'en',
      timezone: 'Africa/Nairobi',
      dateFormat: 'dd/MM/yyyy',
      timeFormat: '24h',
      currency: 'KES'
    });
    this.notificationService.info('General settings reset to defaults');
  }

  resetNotificationSettings(): void {
    this.notificationForm.reset({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      lowStockAlerts: true,
      expiryAlerts: true,
      campaignReminders: true,
      systemUpdates: true,
      notificationFrequency: 'realtime'
    });
    this.notificationService.info('Notification settings reset to defaults');
  }

  resetSecuritySettings(): void {
    this.securityForm.reset({
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginNotifications: true,
      trustedDevicesOnly: false
    });
    this.notificationService.info('Security settings reset to defaults');
  }

  resetDisplaySettings(): void {
    this.displayForm.reset({
      theme: 'light',
      sidebarCollapsed: false,
      compactMode: false,
      showTooltips: true,
      animationsEnabled: true,
      highContrast: false
    });
    this.notificationService.info('Display settings reset to defaults');
  }

  resetDataSettings(): void {
    this.dataForm.reset({
      autoSaveInterval: 5,
      backupFrequency: 'daily',
      dataRetention: 365,
      exportFormat: 'csv'
    });
    this.notificationService.info('Data settings reset to defaults');
  }

  resetAllSettings(): void {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      this.resetGeneralSettings();
      this.resetNotificationSettings();
      this.resetSecuritySettings();
      this.resetDisplaySettings();
      this.resetDataSettings();
      
      localStorage.removeItem('facilityManagerSettings');
      this.notificationService.success('All settings reset to defaults');
    }
  }

  applyTheme(theme: string): void {
    // Apply theme logic here
    // This would typically involve updating CSS variables or classes
    document.body.setAttribute('data-theme', theme);
  }

  testNotifications(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.notificationService.success('Test notification sent successfully!');
    }, 1000);
  }

  enable2FA(): void {
    this.notificationService.info('Two-factor authentication setup would be implemented here');
  }

  exportSettings(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      const allSettings = {
        general: this.generalSettings,
        notifications: this.notificationSettings,
        security: this.securitySettings,
        display: this.displaySettings,
        data: this.dataSettings,
        exportedAt: new Date().toISOString()
      };
      
      const json = JSON.stringify(allSettings, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-${new Date().getTime()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success('Settings exported successfully');
    }, 1000);
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const settings = JSON.parse(e.target.result);
          
          if (settings.general) this.generalForm.patchValue(settings.general);
          if (settings.notifications) this.notificationForm.patchValue(settings.notifications);
          if (settings.security) this.securityForm.patchValue(settings.security);
          if (settings.display) this.displayForm.patchValue(settings.display);
          if (settings.data) this.dataForm.patchValue(settings.data);
          
          this.notificationService.success('Settings imported successfully');
        } catch (error) {
          this.notificationService.error('Invalid settings file');
        }
      };
      reader.readAsText(file);
    }
  }
}
