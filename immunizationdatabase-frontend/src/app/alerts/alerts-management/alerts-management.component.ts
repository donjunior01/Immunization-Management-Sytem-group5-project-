import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface AlertRule {
  id: string;
  name: string;
  type: string;
  category: string;
  condition: string;
  threshold: number;
  thresholdUnit: string;
  priority: string;
  enabled: boolean;
  channels: string[];
  recipients: string[];
  frequency: string;
  description: string;
  lastTriggered?: Date;
  triggeredCount: number;
  createdAt: Date;
  createdBy: string;
}

interface AlertChannel {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
}

interface NotificationPreference {
  category: string;
  enabled: boolean;
  channels: string[];
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    days: string[];
  };
}

@Component({
  selector: 'app-alerts-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './alerts-management.component.html',
  styleUrl: './alerts-management.component.scss'
})
export class AlertsManagementComponent implements OnInit {
  alertRules: AlertRule[] = [];
  filteredRules: AlertRule[] = [];
  alertChannels: AlertChannel[] = [];
  notificationPreferences: NotificationPreference[] = [];
  
  ruleForm: FormGroup;
  channelForm: FormGroup;
  editingRule: AlertRule | null = null;
  editingChannel: AlertChannel | null = null;
  
  // Filter options
  filterType: string = 'all';
  filterCategory: string = 'all';
  filterStatus: string = 'all';
  
  // Options
  ruleTypes = [
    { value: 'stock', label: 'Stock Alert' },
    { value: 'expiry', label: 'Expiry Alert' },
    { value: 'threshold', label: 'Threshold Alert' },
    { value: 'campaign', label: 'Campaign Alert' },
    { value: 'system', label: 'System Alert' }
  ];
  
  categoryOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Information' }
  ];
  
  priorityOptions = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];
  
  conditionOptions = [
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'between', label: 'Between' }
  ];
  
  channelTypeOptions = [
    { value: 'email', label: 'Email', icon: 'email' },
    { value: 'sms', label: 'SMS', icon: 'sms' },
    { value: 'push', label: 'Push Notification', icon: 'notifications' },
    { value: 'webhook', label: 'Webhook', icon: 'webhook' }
  ];
  
  frequencyOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
  ];
  
  displayedColumns: string[] = ['name', 'type', 'priority', 'threshold', 'status', 'lastTriggered', 'actions'];
  activeTab: number = 0;
  showRuleForm: boolean = false;
  showChannelForm: boolean = false;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.ruleForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      category: ['', Validators.required],
      condition: ['', Validators.required],
      threshold: ['', [Validators.required, Validators.min(0)]],
      thresholdUnit: ['', Validators.required],
      priority: ['', Validators.required],
      enabled: [true],
      channels: [[], Validators.required],
      recipients: [''],
      frequency: ['immediate', Validators.required],
      description: ['']
    });

    this.channelForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      enabled: [true],
      config: ['']
    });
  }

  ngOnInit(): void {
    this.loadAlertData();
  }

  loadAlertData(): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.loadAlertRules();
      this.loadAlertChannels();
      this.loadNotificationPreferences();
      this.applyFilters();
    }, 1000);
  }

  loadAlertRules(): void {
    this.alertRules = [
      {
        id: 'RULE001',
        name: 'Low Stock Warning - DTP',
        type: 'stock',
        category: 'warning',
        condition: 'less_than',
        threshold: 100,
        thresholdUnit: 'doses',
        priority: 'high',
        enabled: true,
        channels: ['email', 'push'],
        recipients: ['facility.manager@immunization.com'],
        frequency: 'immediate',
        description: 'Alert when DTP vaccine stock falls below threshold',
        lastTriggered: new Date(Date.now() - 2 * 3600000),
        triggeredCount: 12,
        createdAt: new Date(Date.now() - 30 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE002',
        name: 'Critical Stock Alert - BCG',
        type: 'stock',
        category: 'critical',
        condition: 'less_than',
        threshold: 50,
        thresholdUnit: 'doses',
        priority: 'critical',
        enabled: true,
        channels: ['email', 'sms', 'push'],
        recipients: ['facility.manager@immunization.com', 'health.worker@immunization.com'],
        frequency: 'immediate',
        description: 'Critical alert when BCG stock is critically low',
        lastTriggered: new Date(Date.now() - 5 * 3600000),
        triggeredCount: 5,
        createdAt: new Date(Date.now() - 45 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE003',
        name: 'Expiry Warning - 30 Days',
        type: 'expiry',
        category: 'warning',
        condition: 'less_than',
        threshold: 30,
        thresholdUnit: 'days',
        priority: 'high',
        enabled: true,
        channels: ['email'],
        recipients: ['facility.manager@immunization.com'],
        frequency: 'daily',
        description: 'Alert when vaccine batches are expiring within 30 days',
        lastTriggered: new Date(Date.now() - 24 * 3600000),
        triggeredCount: 8,
        createdAt: new Date(Date.now() - 60 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE004',
        name: 'Critical Expiry Alert - 7 Days',
        type: 'expiry',
        category: 'critical',
        condition: 'less_than',
        threshold: 7,
        thresholdUnit: 'days',
        priority: 'critical',
        enabled: true,
        channels: ['email', 'sms', 'push'],
        recipients: ['facility.manager@immunization.com'],
        frequency: 'immediate',
        description: 'Critical alert for vaccines expiring within 7 days',
        lastTriggered: new Date(Date.now() - 12 * 3600000),
        triggeredCount: 3,
        createdAt: new Date(Date.now() - 60 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE005',
        name: 'Campaign Coverage Below Target',
        type: 'campaign',
        category: 'warning',
        condition: 'less_than',
        threshold: 70,
        thresholdUnit: 'percent',
        priority: 'medium',
        enabled: true,
        channels: ['email', 'push'],
        recipients: ['facility.manager@immunization.com'],
        frequency: 'daily',
        description: 'Alert when campaign coverage is below 70%',
        lastTriggered: new Date(Date.now() - 48 * 3600000),
        triggeredCount: 6,
        createdAt: new Date(Date.now() - 20 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE006',
        name: 'Cold Chain Temperature Alert',
        type: 'system',
        category: 'critical',
        condition: 'greater_than',
        threshold: 8,
        thresholdUnit: '°C',
        priority: 'critical',
        enabled: true,
        channels: ['email', 'sms', 'push'],
        recipients: ['facility.manager@immunization.com', 'health.worker@immunization.com'],
        frequency: 'immediate',
        description: 'Alert when cold chain temperature exceeds safe range',
        triggeredCount: 2,
        createdAt: new Date(Date.now() - 90 * 86400000),
        createdBy: 'Facility Manager'
      },
      {
        id: 'RULE007',
        name: 'High Defaulter Rate',
        type: 'threshold',
        category: 'warning',
        condition: 'greater_than',
        threshold: 20,
        thresholdUnit: 'percent',
        priority: 'high',
        enabled: false,
        channels: ['email'],
        recipients: ['facility.manager@immunization.com'],
        frequency: 'weekly',
        description: 'Alert when defaulter rate exceeds 20%',
        triggeredCount: 0,
        createdAt: new Date(Date.now() - 15 * 86400000),
        createdBy: 'Facility Manager'
      }
    ];
  }

  loadAlertChannels(): void {
    this.alertChannels = [
      {
        id: 'CH001',
        name: 'Primary Email',
        type: 'email',
        enabled: true,
        config: {
          server: 'smtp.gmail.com',
          port: 587,
          from: 'alerts@immunization.com',
          replyTo: 'noreply@immunization.com'
        }
      },
      {
        id: 'CH002',
        name: 'SMS Gateway',
        type: 'sms',
        enabled: true,
        config: {
          provider: 'Twilio',
          from: '+254700000000',
          apiKey: '***hidden***'
        }
      },
      {
        id: 'CH003',
        name: 'Push Notifications',
        type: 'push',
        enabled: true,
        config: {
          provider: 'Firebase Cloud Messaging',
          projectId: 'immunization-db'
        }
      },
      {
        id: 'CH004',
        name: 'Webhook Integration',
        type: 'webhook',
        enabled: false,
        config: {
          url: 'https://api.example.com/alerts',
          method: 'POST',
          headers: { 'Authorization': 'Bearer ***hidden***' }
        }
      }
    ];
  }

  loadNotificationPreferences(): void {
    this.notificationPreferences = [
      {
        category: 'Stock Alerts',
        enabled: true,
        channels: ['email', 'push'],
        schedule: {
          enabled: false,
          startTime: '08:00',
          endTime: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      {
        category: 'Expiry Alerts',
        enabled: true,
        channels: ['email', 'sms', 'push'],
        schedule: {
          enabled: false,
          startTime: '08:00',
          endTime: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      {
        category: 'Campaign Alerts',
        enabled: true,
        channels: ['email', 'push'],
        schedule: {
          enabled: true,
          startTime: '09:00',
          endTime: '17:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        }
      },
      {
        category: 'System Alerts',
        enabled: true,
        channels: ['email', 'sms', 'push'],
        schedule: {
          enabled: false,
          startTime: '00:00',
          endTime: '23:59',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        }
      }
    ];
  }

  applyFilters(): void {
    this.loaderService.show(800);
    
    setTimeout(() => {
      this.filteredRules = this.alertRules.filter(rule => {
        const typeMatch = this.filterType === 'all' || rule.type === this.filterType;
        const categoryMatch = this.filterCategory === 'all' || rule.category === this.filterCategory;
        const statusMatch = this.filterStatus === 'all' || 
          (this.filterStatus === 'enabled' && rule.enabled) ||
          (this.filterStatus === 'disabled' && !rule.enabled);
        
        return typeMatch && categoryMatch && statusMatch;
      });
      
      this.notificationService.success('Filters applied successfully');
    }, 800);
  }

  resetFilters(): void {
    this.filterType = 'all';
    this.filterCategory = 'all';
    this.filterStatus = 'all';
    this.applyFilters();
  }

  openRuleForm(rule?: AlertRule): void {
    this.editingRule = rule || null;
    
    if (rule) {
      this.ruleForm.patchValue({
        name: rule.name,
        type: rule.type,
        category: rule.category,
        condition: rule.condition,
        threshold: rule.threshold,
        thresholdUnit: rule.thresholdUnit,
        priority: rule.priority,
        enabled: rule.enabled,
        channels: rule.channels,
        recipients: rule.recipients.join(', '),
        frequency: rule.frequency,
        description: rule.description
      });
    } else {
      this.ruleForm.reset({ enabled: true, frequency: 'immediate' });
    }
    
    this.showRuleForm = true;
  }

  saveRule(): void {
    if (this.ruleForm.invalid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    this.loaderService.show(800);
    
    setTimeout(() => {
      const formValue = this.ruleForm.value;
      
      if (this.editingRule) {
        // Update existing rule
        const index = this.alertRules.findIndex(r => r.id === this.editingRule!.id);
        if (index !== -1) {
          this.alertRules[index] = {
            ...this.alertRules[index],
            ...formValue,
            recipients: formValue.recipients.split(',').map((r: string) => r.trim())
          };
          this.notificationService.success('Alert rule updated successfully');
        }
      } else {
        // Create new rule
        const newRule: AlertRule = {
          id: `RULE${String(this.alertRules.length + 1).padStart(3, '0')}`,
          ...formValue,
          recipients: formValue.recipients.split(',').map((r: string) => r.trim()),
          triggeredCount: 0,
          createdAt: new Date(),
          createdBy: 'Current User'
        };
        this.alertRules.unshift(newRule);
        this.notificationService.success('Alert rule created successfully');
      }
      
      this.closeRuleForm();
      this.applyFilters();
    }, 800);
  }

  closeRuleForm(): void {
    this.showRuleForm = false;
    this.editingRule = null;
    this.ruleForm.reset();
  }

  toggleRuleStatus(rule: AlertRule): void {
    rule.enabled = !rule.enabled;
    this.notificationService.success(`Alert rule ${rule.enabled ? 'enabled' : 'disabled'}`);
  }

  deleteRule(rule: AlertRule): void {
    if (confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      this.loaderService.show(800);
      
      setTimeout(() => {
        const index = this.alertRules.findIndex(r => r.id === rule.id);
        if (index !== -1) {
          this.alertRules.splice(index, 1);
          this.notificationService.success('Alert rule deleted successfully');
          this.applyFilters();
        }
      }, 800);
    }
  }

  testRule(rule: AlertRule): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.notificationService.success(`Test notification sent via ${rule.channels.join(', ')}`);
      this.notificationService.info(`Recipients: ${rule.recipients.join(', ')}`);
    }, 1000);
  }

  openChannelForm(channel?: AlertChannel): void {
    this.editingChannel = channel || null;
    
    if (channel) {
      this.channelForm.patchValue({
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: JSON.stringify(channel.config, null, 2)
      });
    } else {
      this.channelForm.reset({ enabled: true });
    }
    
    this.showChannelForm = true;
  }

  saveChannel(): void {
    if (this.channelForm.invalid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    this.loaderService.show(800);
    
    setTimeout(() => {
      const formValue = this.channelForm.value;
      
      try {
        const config = formValue.config ? JSON.parse(formValue.config) : {};
        
        if (this.editingChannel) {
          const index = this.alertChannels.findIndex(c => c.id === this.editingChannel!.id);
          if (index !== -1) {
            this.alertChannels[index] = {
              ...this.alertChannels[index],
              name: formValue.name,
              type: formValue.type,
              enabled: formValue.enabled,
              config: config
            };
            this.notificationService.success('Alert channel updated successfully');
          }
        } else {
          const newChannel: AlertChannel = {
            id: `CH${String(this.alertChannels.length + 1).padStart(3, '0')}`,
            name: formValue.name,
            type: formValue.type,
            enabled: formValue.enabled,
            config: config
          };
          this.alertChannels.push(newChannel);
          this.notificationService.success('Alert channel created successfully');
        }
        
        this.closeChannelForm();
      } catch (error) {
        this.notificationService.error('Invalid JSON configuration');
      }
    }, 800);
  }

  closeChannelForm(): void {
    this.showChannelForm = false;
    this.editingChannel = null;
    this.channelForm.reset();
  }

  toggleChannelStatus(channel: AlertChannel): void {
    channel.enabled = !channel.enabled;
    this.notificationService.success(`Channel ${channel.enabled ? 'enabled' : 'disabled'}`);
  }

  deleteChannel(channel: AlertChannel): void {
    if (confirm(`Are you sure you want to delete the channel "${channel.name}"?`)) {
      this.loaderService.show(800);
      
      setTimeout(() => {
        const index = this.alertChannels.findIndex(c => c.id === channel.id);
        if (index !== -1) {
          this.alertChannels.splice(index, 1);
          this.notificationService.success('Alert channel deleted successfully');
        }
      }, 800);
    }
  }

  testChannel(channel: AlertChannel): void {
    this.loaderService.show(1000);
    
    setTimeout(() => {
      this.notificationService.success(`Test message sent via ${channel.type}: ${channel.name}`);
    }, 1000);
  }

  togglePreferenceCategory(preference: NotificationPreference): void {
    preference.enabled = !preference.enabled;
    this.notificationService.success(`${preference.category} ${preference.enabled ? 'enabled' : 'disabled'}`);
  }

  togglePreferenceSchedule(preference: NotificationPreference): void {
    preference.schedule.enabled = !preference.schedule.enabled;
    this.notificationService.success(`Schedule ${preference.schedule.enabled ? 'enabled' : 'disabled'} for ${preference.category}`);
  }

  savePreferences(): void {
    this.loaderService.show(800);
    
    setTimeout(() => {
      this.notificationService.success('Notification preferences saved successfully');
    }, 800);
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getCategoryClass(category: string): string {
    return `category-${category}`;
  }

  getChannelIcon(type: string): string {
    const channel = this.channelTypeOptions.find(c => c.value === type);
    return channel ? channel.icon : 'notifications';
  }

  formatTimestamp(date?: Date): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  }
}
