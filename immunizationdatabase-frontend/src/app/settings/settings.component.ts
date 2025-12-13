import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { LoaderService } from '../services/loader.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

interface UserSettings {
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  autoSync: boolean;
  defaultView: string;
  itemsPerPage: number;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatListModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  currentUser: any;

  themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'sw', label: 'Swahili' }
  ];

  defaultViews = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'patients', label: 'Patients' },
    { value: 'vaccinations', label: 'Vaccinations' },
    { value: 'inventory', label: 'Inventory' }
  ];

  itemsPerPageOptions = [10, 25, 50, 100];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.settingsForm = this.fb.group({
      theme: ['light', Validators.required],
      language: ['en', Validators.required],
      emailNotifications: [true],
      pushNotifications: [true],
      smsNotifications: [false],
      autoSync: [true],
      defaultView: ['dashboard', Validators.required],
      itemsPerPage: [25, [Validators.required, Validators.min(10)]]
    });
  }

  ngOnInit(): void {
    this.loaderService.show();
    this.currentUser = this.authService.getCurrentUser();
    this.loadSettings();
  }

  loadSettings(): void {
    // Load settings from localStorage or backend
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings: UserSettings = JSON.parse(savedSettings);
      this.settingsForm.patchValue({
        theme: settings.theme,
        language: settings.language,
        emailNotifications: settings.notifications.email,
        pushNotifications: settings.notifications.push,
        smsNotifications: settings.notifications.sms,
        autoSync: settings.autoSync,
        defaultView: settings.defaultView,
        itemsPerPage: settings.itemsPerPage
      });
    }
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      const formValue = this.settingsForm.value;
      const settings: UserSettings = {
        theme: formValue.theme,
        language: formValue.language,
        notifications: {
          email: formValue.emailNotifications,
          push: formValue.pushNotifications,
          sms: formValue.smsNotifications
        },
        autoSync: formValue.autoSync,
        defaultView: formValue.defaultView,
        itemsPerPage: formValue.itemsPerPage
      };

      localStorage.setItem('userSettings', JSON.stringify(settings));
      this.notificationService.success('Settings saved successfully');
    }, 1000);
  }

  resetSettings(): void {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.settingsForm.reset({
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        autoSync: true,
        defaultView: 'dashboard',
        itemsPerPage: 25
      });
      localStorage.removeItem('userSettings');
      this.notificationService.success('Settings reset to defaults');
    }, 1000);
  }

  clearCache(): void {
    if (!confirm('Are you sure you want to clear all cached data? This will log you out.')) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      this.notificationService.success('Cache cleared successfully');
      setTimeout(() => {
        this.authService.logout();
        window.location.reload();
      }, 1500);
    }, 1000);
  }

  exportSettings(): void {
    this.loaderService.show();
    setTimeout(() => {
      const settings = this.settingsForm.value;
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.notificationService.success('Settings exported successfully');
    }, 1000);
  }
}
