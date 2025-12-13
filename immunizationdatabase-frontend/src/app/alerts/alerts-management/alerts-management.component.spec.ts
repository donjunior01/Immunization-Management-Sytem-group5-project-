import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AlertsManagementComponent } from './alerts-management.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

describe('AlertsManagementComponent', () => {
  let component: AlertsManagementComponent;
  let fixture: ComponentFixture<AlertsManagementComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    await TestBed.configureTestingModule({
      imports: [AlertsManagementComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(AlertsManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alert data on init', () => {
    spyOn(component, 'loadAlertData');
    component.ngOnInit();
    expect(component.loadAlertData).toHaveBeenCalled();
  });

  it('should load alert rules', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      expect(component.alertRules.length).toBe(7);
      expect(component.alertRules[0].name).toBe('Low Stock Warning - DTP');
      expect(component.alertRules[1].priority).toBe('critical');
      done();
    }, 1100);
  });

  it('should load alert channels', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      expect(component.alertChannels.length).toBe(4);
      expect(component.alertChannels[0].type).toBe('email');
      expect(component.alertChannels[1].type).toBe('sms');
      done();
    }, 1100);
  });

  it('should load notification preferences', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      expect(component.notificationPreferences.length).toBe(4);
      expect(component.notificationPreferences[0].category).toBe('Stock Alerts');
      done();
    }, 1100);
  });

  it('should apply filters', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      component.filterType = 'stock';
      component.applyFilters();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.filteredRules.every(r => r.type === 'stock')).toBe(true);
        expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should reset filters', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      component.filterType = 'stock';
      component.filterCategory = 'critical';
      
      spyOn(component, 'applyFilters');
      component.resetFilters();
      
      expect(component.filterType).toBe('all');
      expect(component.filterCategory).toBe('all');
      expect(component.applyFilters).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should open rule form for new rule', () => {
    component.openRuleForm();
    
    expect(component.showRuleForm).toBe(true);
    expect(component.editingRule).toBeNull();
  });

  it('should open rule form for editing', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const rule = component.alertRules[0];
      component.openRuleForm(rule);
      
      expect(component.showRuleForm).toBe(true);
      expect(component.editingRule).toBe(rule);
      expect(component.ruleForm.get('name')?.value).toBe(rule.name);
      done();
    }, 1100);
  });

  it('should save new rule', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      component.openRuleForm();
      component.ruleForm.patchValue({
        name: 'Test Rule',
        type: 'stock',
        category: 'warning',
        condition: 'less_than',
        threshold: 50,
        thresholdUnit: 'doses',
        priority: 'medium',
        enabled: true,
        channels: ['email'],
        recipients: 'test@example.com',
        frequency: 'immediate',
        description: 'Test description'
      });
      
      const initialLength = component.alertRules.length;
      component.saveRule();
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.alertRules.length).toBe(initialLength + 1);
        expect(notificationService.success).toHaveBeenCalledWith('Alert rule created successfully');
        expect(component.showRuleForm).toBe(false);
        done();
      }, 900);
    }, 1100);
  });

  it('should update existing rule', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const rule = component.alertRules[0];
      component.openRuleForm(rule);
      component.ruleForm.patchValue({ name: 'Updated Rule Name' });
      component.saveRule();
      
      setTimeout(() => {
        expect(component.alertRules[0].name).toBe('Updated Rule Name');
        expect(notificationService.success).toHaveBeenCalledWith('Alert rule updated successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should toggle rule status', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const rule = component.alertRules[0];
      const initialStatus = rule.enabled;
      
      component.toggleRuleStatus(rule);
      
      expect(rule.enabled).toBe(!initialStatus);
      expect(notificationService.success).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should delete rule', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      const initialLength = component.alertRules.length;
      const rule = component.alertRules[0];
      
      component.deleteRule(rule);
      
      expect(loaderService.show).toHaveBeenCalledWith(800);
      
      setTimeout(() => {
        expect(component.alertRules.length).toBe(initialLength - 1);
        expect(notificationService.success).toHaveBeenCalledWith('Alert rule deleted successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should test rule', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const rule = component.alertRules[0];
      component.testRule(rule);
      
      expect(loaderService.show).toHaveBeenCalledWith(1000);
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalled();
        expect(notificationService.info).toHaveBeenCalled();
        done();
      }, 1100);
    }, 1100);
  });

  it('should open channel form', () => {
    component.openChannelForm();
    
    expect(component.showChannelForm).toBe(true);
    expect(component.editingChannel).toBeNull();
  });

  it('should save new channel', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      component.openChannelForm();
      component.channelForm.patchValue({
        name: 'Test Channel',
        type: 'email',
        enabled: true,
        config: '{"test": "value"}'
      });
      
      const initialLength = component.alertChannels.length;
      component.saveChannel();
      
      setTimeout(() => {
        expect(component.alertChannels.length).toBe(initialLength + 1);
        expect(notificationService.success).toHaveBeenCalledWith('Alert channel created successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should handle invalid JSON in channel config', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      component.openChannelForm();
      component.channelForm.patchValue({
        name: 'Test Channel',
        type: 'email',
        enabled: true,
        config: 'invalid json'
      });
      
      component.saveChannel();
      
      setTimeout(() => {
        expect(notificationService.error).toHaveBeenCalledWith('Invalid JSON configuration');
        done();
      }, 900);
    }, 1100);
  });

  it('should toggle channel status', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const channel = component.alertChannels[0];
      const initialStatus = channel.enabled;
      
      component.toggleChannelStatus(channel);
      
      expect(channel.enabled).toBe(!initialStatus);
      expect(notificationService.success).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should delete channel', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      const initialLength = component.alertChannels.length;
      const channel = component.alertChannels[0];
      
      component.deleteChannel(channel);
      
      setTimeout(() => {
        expect(component.alertChannels.length).toBe(initialLength - 1);
        expect(notificationService.success).toHaveBeenCalledWith('Alert channel deleted successfully');
        done();
      }, 900);
    }, 1100);
  });

  it('should test channel', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const channel = component.alertChannels[0];
      component.testChannel(channel);
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalled();
        done();
      }, 1100);
    }, 1100);
  });

  it('should toggle preference category', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const preference = component.notificationPreferences[0];
      const initialStatus = preference.enabled;
      
      component.togglePreferenceCategory(preference);
      
      expect(preference.enabled).toBe(!initialStatus);
      expect(notificationService.success).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should toggle preference schedule', (done) => {
    component.loadAlertData();
    
    setTimeout(() => {
      const preference = component.notificationPreferences[0];
      const initialStatus = preference.schedule.enabled;
      
      component.togglePreferenceSchedule(preference);
      
      expect(preference.schedule.enabled).toBe(!initialStatus);
      expect(notificationService.success).toHaveBeenCalled();
      done();
    }, 1100);
  });

  it('should save preferences', (done) => {
    component.savePreferences();
    
    expect(loaderService.show).toHaveBeenCalledWith(800);
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Notification preferences saved successfully');
      done();
    }, 900);
  });

  it('should return correct priority class', () => {
    expect(component.getPriorityClass('critical')).toBe('priority-critical');
    expect(component.getPriorityClass('high')).toBe('priority-high');
    expect(component.getPriorityClass('medium')).toBe('priority-medium');
    expect(component.getPriorityClass('low')).toBe('priority-low');
  });

  it('should return correct category class', () => {
    expect(component.getCategoryClass('critical')).toBe('category-critical');
    expect(component.getCategoryClass('warning')).toBe('category-warning');
  });

  it('should return correct channel icon', () => {
    expect(component.getChannelIcon('email')).toBe('email');
    expect(component.getChannelIcon('sms')).toBe('sms');
    expect(component.getChannelIcon('push')).toBe('notifications');
    expect(component.getChannelIcon('unknown')).toBe('notifications');
  });

  it('should format timestamp correctly', () => {
    const now = new Date();
    const justNow = new Date(now.getTime() - 30000);
    const minutesAgo = new Date(now.getTime() - 5 * 60000);
    const hoursAgo = new Date(now.getTime() - 3 * 3600000);

    expect(component.formatTimestamp(justNow)).toBe('Just now');
    expect(component.formatTimestamp(minutesAgo)).toBe('5m ago');
    expect(component.formatTimestamp(hoursAgo)).toBe('3h ago');
    expect(component.formatTimestamp()).toBe('Never');
  });

  it('should close rule form', () => {
    component.showRuleForm = true;
    component.closeRuleForm();
    
    expect(component.showRuleForm).toBe(false);
    expect(component.editingRule).toBeNull();
  });

  it('should close channel form', () => {
    component.showChannelForm = true;
    component.closeChannelForm();
    
    expect(component.showChannelForm).toBe(false);
    expect(component.editingChannel).toBeNull();
  });

  it('should show error when saving invalid rule form', () => {
    component.openRuleForm();
    component.ruleForm.reset();
    component.saveRule();
    
    expect(notificationService.error).toHaveBeenCalledWith('Please fill all required fields');
  });

  it('should show error when saving invalid channel form', () => {
    component.openChannelForm();
    component.channelForm.reset();
    component.saveChannel();
    
    expect(notificationService.error).toHaveBeenCalledWith('Please fill all required fields');
  });
});
