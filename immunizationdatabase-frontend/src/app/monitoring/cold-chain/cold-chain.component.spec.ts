import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColdChainComponent } from './cold-chain.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('ColdChainComponent', () => {
  let component: ColdChainComponent;
  let fixture: ComponentFixture<ColdChainComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockDevice: any = {
    id: 'DEV001',
    name: 'Refrigerator 1',
    location: 'Vaccine Storage Room',
    facilityId: 'FAC001',
    type: 'Refrigerator' as const,
    minTemp: 2,
    maxTemp: 8,
    currentTemp: 5.5,
    lastReading: new Date('2024-12-01T10:00:00'),
    status: 'Active' as const,
    batteryLevel: 85
  };

  const mockLog: any = {
    id: 1,
    deviceId: 'DEV001',
    deviceName: 'Refrigerator 1',
    location: 'Vaccine Storage Room',
    facilityId: 'FAC001',
    facilityName: 'Central Hospital',
    temperature: 5.5,
    humidity: 65,
    timestamp: new Date('2024-12-01T10:00:00'),
    minThreshold: 2,
    maxThreshold: 8,
    status: 'Normal' as const,
    alertSent: false,
    batteryLevel: 85
  };

  beforeEach(async () => {
    const loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ColdChainComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(ColdChainComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('deviceId')).toBeTruthy();
      expect(component.filterForm.get('facilityId')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('dateFrom')).toBeTruthy();
      expect(component.filterForm.get('dateTo')).toBeTruthy();
    });

    it('should initialize device form with correct controls', () => {
      expect(component.deviceForm.get('id')).toBeTruthy();
      expect(component.deviceForm.get('name')).toBeTruthy();
      expect(component.deviceForm.get('location')).toBeTruthy();
      expect(component.deviceForm.get('facilityId')).toBeTruthy();
      expect(component.deviceForm.get('type')).toBeTruthy();
      expect(component.deviceForm.get('minTemp')).toBeTruthy();
      expect(component.deviceForm.get('maxTemp')).toBeTruthy();
      expect(component.deviceForm.get('status')).toBeTruthy();
    });

    it('should initialize alert form with correct controls', () => {
      expect(component.alertForm.get('deviceId')).toBeTruthy();
      expect(component.alertForm.get('minThreshold')).toBeTruthy();
      expect(component.alertForm.get('maxThreshold')).toBeTruthy();
      expect(component.alertForm.get('emailNotification')).toBeTruthy();
      expect(component.alertForm.get('smsNotification')).toBeTruthy();
      expect(component.alertForm.get('recipients')).toBeTruthy();
    });
  });

  describe('Data Loading', () => {
    it('should generate mock devices', () => {
      component.generateMockDevices();
      expect(component.devices.length).toBe(15);
      expect(component.devices[0].id).toContain('DEV');
    });

    it('should generate mock logs', () => {
      component.generateMockDevices();
      component.generateMockLogs();
      expect(component.temperatureLogs.length).toBe(100);
    });

    it('should calculate statistics correctly', () => {
      component.devices = [mockDevice];
      component.temperatureLogs = [mockLog];
      
      component.calculateStats();
      
      expect(component.stats.totalDevices).toBe(1);
      expect(component.stats.activeDevices).toBe(1);
      expect(component.stats.criticalAlerts).toBe(0);
      expect(component.stats.warningAlerts).toBe(0);
      expect(component.stats.complianceRate).toBe(100);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.temperatureLogs = [mockLog];
    });

    it('should apply filters with empty search', () => {
      component.filterForm.patchValue({ search: '' });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
    });

    it('should filter by search term', () => {
      component.temperatureLogs = [
        { ...mockLog, deviceName: 'Refrigerator 1' },
        { ...mockLog, id: 2, deviceName: 'Freezer 1' }
      ];
      
      component.filterForm.patchValue({ search: 'Refrigerator' });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
      expect(component.filteredLogs[0].deviceName).toContain('Refrigerator');
    });

    it('should filter by device ID', () => {
      component.filterForm.patchValue({ deviceId: 'DEV001' });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
    });

    it('should filter by facility ID', () => {
      component.filterForm.patchValue({ facilityId: 'FAC001' });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
    });

    it('should filter by status', () => {
      component.filterForm.patchValue({ status: 'Normal' });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
    });

    it('should filter by date range', () => {
      const dateFrom = new Date('2024-11-01');
      const dateTo = new Date('2024-12-31');
      
      component.filterForm.patchValue({ dateFrom, dateTo });
      component.applyFilters();
      expect(component.filteredLogs.length).toBe(1);
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({ search: 'test', status: 'Warning' });
      component.resetFilters();
      expect(component.filterForm.value.search).toBeNull();
      expect(component.filterForm.value.status).toBeNull();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.filteredLogs = Array(50).fill(null).map((_, i) => ({ ...mockLog, id: i + 1 }));
    });

    it('should handle page event', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 50 } as any;
      component.handlePageEvent(event);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should return correct paginated logs', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      const logs = component.getPaginatedLogs();
      expect(logs.length).toBe(10);
      expect(logs[0].id).toBe(1);
    });
  });

  describe('Device Management', () => {
    it('should open create device dialog', () => {
      component.openDeviceDialog();
      expect(component.showDeviceDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should open edit device dialog', () => {
      component.openDeviceDialog(mockDevice);
      expect(component.showDeviceDialog).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedDevice).toBe(mockDevice);
    });

    it('should close device dialog', () => {
      component.showDeviceDialog = true;
      component.closeDeviceDialog();
      expect(component.showDeviceDialog).toBe(false);
      expect(component.selectedDevice).toBeNull();
    });

    it('should save new device', () => {
      spyOn(localStorage, 'setItem');
      component.deviceForm.patchValue({
        id: 'DEV999',
        name: 'Test Device',
        location: 'Test Location',
        facilityId: 'FAC001',
        type: 'Refrigerator',
        minTemp: 2,
        maxTemp: 8,
        status: 'Active'
      });

      component.saveDevice();
      expect(component.devices.length).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Device registered successfully');
    });

    it('should update existing device', () => {
      spyOn(localStorage, 'setItem');
      component.isEditMode = true;
      component.selectedDevice = mockDevice;
      component.deviceForm.patchValue({
        id: 'DEV001',
        name: 'Updated Device',
        location: 'Updated Location',
        facilityId: 'FAC001',
        type: 'Refrigerator',
        minTemp: 2,
        maxTemp: 8,
        status: 'Active'
      });

      component.saveDevice();
      expect(component.selectedDevice?.name).toBe('Updated Device');
      expect(notificationService.success).toHaveBeenCalledWith('Device updated successfully');
    });

    it('should not save device with invalid form', () => {
      component.deviceForm.reset();
      component.saveDevice();
      expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should delete device', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(localStorage, 'setItem');
      component.devices = [mockDevice];
      component.temperatureLogs = [mockLog];

      component.deleteDevice(mockDevice);
      expect(component.devices.length).toBe(0);
      expect(component.temperatureLogs.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalledWith('Device deleted successfully');
    });

    it('should not delete device when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.devices = [mockDevice];

      component.deleteDevice(mockDevice);
      expect(component.devices.length).toBe(1);
    });
  });

  describe('Form Validation', () => {
    it('should require device ID', () => {
      const control = component.deviceForm.get('id');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require device name', () => {
      const control = component.deviceForm.get('name');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate device name minimum length', () => {
      const control = component.deviceForm.get('name');
      control?.setValue('AB');
      expect(control?.hasError('minlength')).toBe(true);
    });

    it('should require device type', () => {
      const control = component.deviceForm.get('type');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require location', () => {
      const control = component.deviceForm.get('location');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require facility ID', () => {
      const control = component.deviceForm.get('facilityId');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require min temperature', () => {
      const control = component.deviceForm.get('minTemp');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate min temperature minimum value', () => {
      const control = component.deviceForm.get('minTemp');
      control?.setValue(-100);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should require max temperature', () => {
      const control = component.deviceForm.get('maxTemp');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate max temperature maximum value', () => {
      const control = component.deviceForm.get('maxTemp');
      control?.setValue(60);
      expect(control?.hasError('max')).toBe(true);
    });

    it('should validate email in alert form', () => {
      const control = component.alertForm.get('recipients');
      control?.setValue('invalid-email');
      expect(control?.hasError('email')).toBe(true);
    });
  });

  describe('Log Details', () => {
    it('should view log details', () => {
      component.viewLogDetails(mockLog);
      expect(component.selectedLog).toBe(mockLog);
      expect(component.showDetailDialog).toBe(true);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.selectedLog = mockLog;
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBe(false);
      expect(component.selectedLog).toBeNull();
    });
  });

  describe('Alert Settings', () => {
    it('should open alert settings', () => {
      component.openAlertSettings(mockDevice);
      expect(component.showAlertDialog).toBe(true);
      expect(component.selectedDevice).toBe(mockDevice);
      expect(component.alertForm.value.deviceId).toBe(mockDevice.id);
    });

    it('should close alert dialog', () => {
      component.showAlertDialog = true;
      component.closeAlertDialog();
      expect(component.showAlertDialog).toBe(false);
      expect(component.selectedDevice).toBeNull();
    });

    it('should save alert settings', () => {
      spyOn(localStorage, 'setItem');
      component.selectedDevice = mockDevice;
      component.alertForm.patchValue({
        deviceId: 'DEV001',
        minThreshold: 1,
        maxThreshold: 9,
        emailNotification: true,
        smsNotification: false,
        recipients: 'test@example.com'
      });

      component.saveAlertSettings();
      expect(component.selectedDevice?.minTemp).toBe(1);
      expect(component.selectedDevice?.maxTemp).toBe(9);
      expect(notificationService.success).toHaveBeenCalledWith('Alert settings updated successfully');
    });

    it('should acknowledge alert', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(localStorage, 'setItem');
      const log = { ...mockLog, alertSent: true };

      component.acknowledgeAlert(log);
      expect(log.alertSent).toBe(false);
      expect(notificationService.success).toHaveBeenCalledWith('Alert acknowledged');
    });
  });

  describe('Auto Refresh', () => {
    it('should start auto refresh', () => {
      spyOn(window, 'setInterval').and.returnValue(123 as any);
      component.startAutoRefresh();
      expect(setInterval).toHaveBeenCalled();
    });

    it('should stop auto refresh', () => {
      spyOn(window, 'clearInterval');
      component.refreshInterval = 123;
      component.stopAutoRefresh();
      expect(clearInterval).toHaveBeenCalledWith(123);
    });

    it('should toggle auto refresh on', () => {
      spyOn(component, 'startAutoRefresh');
      component.autoRefresh = true;
      component.toggleAutoRefresh();
      expect(component.startAutoRefresh).toHaveBeenCalled();
    });

    it('should toggle auto refresh off', () => {
      spyOn(component, 'stopAutoRefresh');
      component.autoRefresh = false;
      component.toggleAutoRefresh();
      expect(component.stopAutoRefresh).toHaveBeenCalled();
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data and update logs', () => {
      spyOn(localStorage, 'setItem');
      component.devices = [mockDevice];
      component.temperatureLogs = [];
      
      component.refreshData();
      expect(component.temperatureLogs.length).toBe(1);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.filteredLogs = [mockLog];
    });

    it('should export logs as CSV', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportLogs('csv');
      expect((component as any).downloadFile).toHaveBeenCalled();
    });

    it('should export logs as JSON', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportLogs('json');
      expect((component as any).downloadFile).toHaveBeenCalled();
    });

    it('should show message for PDF export', () => {
      component.exportLogs('pdf');
      expect(notificationService.info).toHaveBeenCalledWith('PDF export will be implemented with a reporting library');
    });
  });

  describe('Helper Methods', () => {
    it('should get correct status color', () => {
      expect(component.getStatusColor('Normal')).toBe('primary');
      expect(component.getStatusColor('Warning')).toBe('accent');
      expect(component.getStatusColor('Critical')).toBe('warn');
      expect(component.getStatusColor('Alarm')).toBe('warn');
    });

    it('should get correct device status color', () => {
      expect(component.getDeviceStatusColor('Active')).toBe('primary');
      expect(component.getDeviceStatusColor('Inactive')).toBe('');
      expect(component.getDeviceStatusColor('Maintenance')).toBe('accent');
      expect(component.getDeviceStatusColor('Error')).toBe('warn');
    });

    it('should get correct battery color', () => {
      expect(component.getBatteryColor(80)).toBe('primary');
      expect(component.getBatteryColor(40)).toBe('accent');
      expect(component.getBatteryColor(15)).toBe('warn');
      expect(component.getBatteryColor(undefined)).toBe('warn');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-12-01T10:00:00');
      const formatted = component.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('12');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format temperature correctly', () => {
      expect(component.formatTemperature(5.5)).toBe('5.5°C');
      expect(component.formatTemperature(-20)).toBe('-20.0°C');
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.devices = [mockDevice];
      component.temperatureLogs = [mockLog];
      
      (component as any).saveToLocalStorage();
      expect(localStorage.setItem).toHaveBeenCalledWith('coldChainDevices', jasmine.any(String));
      expect(localStorage.setItem).toHaveBeenCalledWith('coldChainLogs', jasmine.any(String));
    });

    it('should load from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValues(
        JSON.stringify([mockDevice]),
        JSON.stringify([mockLog])
      );
      
      (component as any).loadFromLocalStorage();
      expect(component.devices.length).toBe(1);
      expect(component.temperatureLogs.length).toBe(1);
    });
  });
});
