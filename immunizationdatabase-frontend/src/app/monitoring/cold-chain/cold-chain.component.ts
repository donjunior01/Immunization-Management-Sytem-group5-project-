import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface TemperatureLog {
  id: number;
  deviceId: string;
  deviceName: string;
  location: string;
  facilityId: string;
  facilityName: string;
  temperature: number;
  humidity?: number;
  timestamp: Date;
  minThreshold: number;
  maxThreshold: number;
  status: 'Normal' | 'Warning' | 'Critical' | 'Alarm';
  alertSent: boolean;
  batteryLevel?: number;
  notes?: string;
}

interface MonitoringDevice {
  id: string;
  name: string;
  location: string;
  facilityId: string;
  type: 'Refrigerator' | 'Freezer' | 'Cold Room' | 'Transport' | 'Portable';
  minTemp: number;
  maxTemp: number;
  currentTemp?: number;
  lastReading?: Date;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Error';
  batteryLevel?: number;
}

interface ColdChainStats {
  totalDevices: number;
  activeDevices: number;
  criticalAlerts: number;
  warningAlerts: number;
  averageTemp: number;
  complianceRate: number;
}

@Component({
  selector: 'app-cold-chain',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSlideToggleModule
  ],
  templateUrl: './cold-chain.component.html',
  styleUrl: './cold-chain.component.scss'
})
export class ColdChainComponent implements OnInit {
  temperatureLogs: TemperatureLog[] = [];
  filteredLogs: TemperatureLog[] = [];
  devices: MonitoringDevice[] = [];
  stats: ColdChainStats = {
    totalDevices: 0,
    activeDevices: 0,
    criticalAlerts: 0,
    warningAlerts: 0,
    averageTemp: 0,
    complianceRate: 0
  };

  filterForm: FormGroup;
  deviceForm: FormGroup;
  alertForm: FormGroup;

  displayedColumns: string[] = ['device', 'location', 'temperature', 'humidity', 'timestamp', 'status', 'battery', 'actions'];
  
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 25, 50, 100];

  showDeviceDialog = false;
  showAlertDialog = false;
  showDetailDialog = false;
  selectedLog: TemperatureLog | null = null;
  selectedDevice: MonitoringDevice | null = null;
  isEditMode = false;

  statusOptions = ['Normal', 'Warning', 'Critical', 'Alarm'];
  deviceTypeOptions = ['Refrigerator', 'Freezer', 'Cold Room', 'Transport', 'Portable'];
  deviceStatusOptions = ['Active', 'Inactive', 'Maintenance', 'Error'];
  facilities = [
    { id: 'FAC001', name: 'Central Hospital' },
    { id: 'FAC002', name: 'County Clinic' },
    { id: 'FAC003', name: 'District Health Center' },
    { id: 'FAC004', name: 'Community Hospital' },
    { id: 'FAC005', name: 'Regional Medical Center' }
  ];

  autoRefresh = true;
  refreshInterval: any;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      deviceId: [''],
      facilityId: [''],
      status: [''],
      dateFrom: [''],
      dateTo: ['']
    });

    this.deviceForm = this.fb.group({
      id: ['', Validators.required],
      name: ['', [Validators.required, Validators.minLength(3)]],
      location: ['', Validators.required],
      facilityId: ['', Validators.required],
      type: ['', Validators.required],
      minTemp: ['', [Validators.required, Validators.min(-80)]],
      maxTemp: ['', [Validators.required, Validators.max(50)]],
      status: ['Active']
    });

    this.alertForm = this.fb.group({
      deviceId: ['', Validators.required],
      minThreshold: ['', [Validators.required, Validators.min(-80)]],
      maxThreshold: ['', [Validators.required, Validators.max(50)]],
      emailNotification: [true],
      smsNotification: [false],
      recipients: ['', Validators.email]
    });
  }

  ngOnInit(): void {
    this.generateMockDevices();
    this.generateMockLogs();
    this.calculateStats();
    this.applyFilters();
    this.loadFromLocalStorage();
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  generateMockDevices(): void {
    const types: Array<MonitoringDevice['type']> = ['Refrigerator', 'Freezer', 'Cold Room', 'Transport', 'Portable'];
    const statuses: Array<MonitoringDevice['status']> = ['Active', 'Inactive', 'Maintenance', 'Error'];
    const locations = ['Vaccine Storage Room', 'Pharmacy', 'Emergency Dept', 'Outpatient Clinic', 'Mobile Unit'];

    for (let i = 1; i <= 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const facility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      const minTemp = type === 'Freezer' ? -25 : 2;
      const maxTemp = type === 'Freezer' ? -15 : 8;
      const currentTemp = minTemp + Math.random() * (maxTemp - minTemp);

      this.devices.push({
        id: `DEV${String(i).padStart(3, '0')}`,
        name: `${type} ${i}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        facilityId: facility.id,
        type,
        minTemp,
        maxTemp,
        currentTemp: Math.round(currentTemp * 10) / 10,
        lastReading: new Date(Date.now() - Math.random() * 3600000),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        batteryLevel: Math.floor(Math.random() * 100)
      });
    }
  }

  generateMockLogs(): void {
    const now = new Date();
    
    for (let i = 0; i < 100; i++) {
      const device = this.devices[Math.floor(Math.random() * this.devices.length)];
      const facility = this.facilities.find(f => f.id === device.facilityId);
      const baseTemp = device.minTemp + Math.random() * (device.maxTemp - device.minTemp);
      const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
      const temperature = Math.round((baseTemp + tempVariation) * 10) / 10;
      
      let status: TemperatureLog['status'] = 'Normal';
      if (temperature < device.minTemp || temperature > device.maxTemp) {
        status = Math.abs(temperature - device.minTemp) > 2 || Math.abs(temperature - device.maxTemp) > 2 
          ? 'Critical' 
          : 'Warning';
      }
      
      this.temperatureLogs.push({
        id: i + 1,
        deviceId: device.id,
        deviceName: device.name,
        location: device.location,
        facilityId: device.facilityId,
        facilityName: facility?.name || '',
        temperature,
        humidity: Math.floor(Math.random() * 40 + 40),
        timestamp: new Date(now.getTime() - Math.random() * 7 * 24 * 3600000),
        minThreshold: device.minTemp,
        maxThreshold: device.maxTemp,
        status,
        alertSent: status !== 'Normal' && Math.random() > 0.3,
        batteryLevel: Math.floor(Math.random() * 100),
        notes: status !== 'Normal' ? `Temperature ${status.toLowerCase()} detected` : undefined
      });
    }

    this.temperatureLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  calculateStats(): void {
    this.stats.totalDevices = this.devices.length;
    this.stats.activeDevices = this.devices.filter(d => d.status === 'Active').length;
    this.stats.criticalAlerts = this.temperatureLogs.filter(l => l.status === 'Critical').length;
    this.stats.warningAlerts = this.temperatureLogs.filter(l => l.status === 'Warning').length;
    
    const recentLogs = this.temperatureLogs.slice(0, 20);
    this.stats.averageTemp = recentLogs.length > 0
      ? Math.round(recentLogs.reduce((sum, log) => sum + log.temperature, 0) / recentLogs.length * 10) / 10
      : 0;
    
    const normalLogs = this.temperatureLogs.filter(l => l.status === 'Normal').length;
    this.stats.complianceRate = this.temperatureLogs.length > 0
      ? Math.round((normalLogs / this.temperatureLogs.length) * 100)
      : 100;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.filteredLogs = this.temperatureLogs.filter(log => {
      const matchesSearch = !filters.search || 
        log.deviceName.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.facilityName.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesDevice = !filters.deviceId || log.deviceId === filters.deviceId;
      const matchesFacility = !filters.facilityId || log.facilityId === filters.facilityId;
      const matchesStatus = !filters.status || log.status === filters.status;
      
      const matchesDateFrom = !filters.dateFrom || 
        new Date(log.timestamp) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || 
        new Date(log.timestamp) <= new Date(filters.dateTo);
      
      return matchesSearch && matchesDevice && matchesFacility && matchesStatus && 
             matchesDateFrom && matchesDateTo;
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilters();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedLogs(): TemperatureLog[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredLogs.slice(startIndex, startIndex + this.pageSize);
  }

  openDeviceDialog(device?: MonitoringDevice): void {
    this.isEditMode = !!device;
    this.selectedDevice = device || null;
    
    if (device) {
      this.deviceForm.patchValue(device);
    } else {
      this.deviceForm.reset({ status: 'Active' });
    }
    
    this.showDeviceDialog = true;
  }

  closeDeviceDialog(): void {
    this.showDeviceDialog = false;
    this.selectedDevice = null;
    this.deviceForm.reset();
  }

  saveDevice(): void {
    if (this.deviceForm.valid) {
      const deviceData = this.deviceForm.value;
      
      if (this.isEditMode && this.selectedDevice) {
        Object.assign(this.selectedDevice, deviceData);
        this.notificationService.success('Device updated successfully');
      } else {
        const newDevice: MonitoringDevice = {
          ...deviceData,
          lastReading: new Date(),
          batteryLevel: 100
        };
        this.devices.push(newDevice);
        this.notificationService.success('Device registered successfully');
      }
      
      this.saveToLocalStorage();
      this.calculateStats();
      this.closeDeviceDialog();
    } else {
      this.deviceForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
    }
  }

  viewLogDetails(log: TemperatureLog): void {
    this.selectedLog = log;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedLog = null;
  }

  openAlertSettings(device: MonitoringDevice): void {
    this.selectedDevice = device;
    this.alertForm.patchValue({
      deviceId: device.id,
      minThreshold: device.minTemp,
      maxThreshold: device.maxTemp
    });
    this.showAlertDialog = true;
  }

  closeAlertDialog(): void {
    this.showAlertDialog = false;
    this.selectedDevice = null;
    this.alertForm.reset();
  }

  saveAlertSettings(): void {
    if (this.alertForm.valid) {
      const alertData = this.alertForm.value;
      
      if (this.selectedDevice) {
        this.selectedDevice.minTemp = alertData.minThreshold;
        this.selectedDevice.maxTemp = alertData.maxThreshold;
        this.saveToLocalStorage();
        this.notificationService.success('Alert settings updated successfully');
        this.closeAlertDialog();
      }
    } else {
      this.alertForm.markAllAsTouched();
    }
  }

  acknowledgeAlert(log: TemperatureLog): void {
    if (confirm(`Acknowledge alert for ${log.deviceName}?`)) {
      log.alertSent = false;
      this.saveToLocalStorage();
      this.calculateStats();
      this.notificationService.success('Alert acknowledged');
    }
  }

  deleteDevice(device: MonitoringDevice): void {
    if (confirm(`Delete device ${device.name}? This will also remove all associated logs.`)) {
      this.devices = this.devices.filter(d => d.id !== device.id);
      this.temperatureLogs = this.temperatureLogs.filter(l => l.deviceId !== device.id);
      this.saveToLocalStorage();
      this.calculateStats();
      this.applyFilters();
      this.notificationService.success('Device deleted successfully');
    }
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshData();
    }, 30000); // Refresh every 30 seconds
  }

  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshData(): void {
    // Simulate new readings for active devices
    this.devices.forEach(device => {
      if (device.status === 'Active') {
        const baseTemp = device.minTemp + Math.random() * (device.maxTemp - device.minTemp);
        const tempVariation = (Math.random() - 0.5) * 2;
        device.currentTemp = Math.round((baseTemp + tempVariation) * 10) / 10;
        device.lastReading = new Date();
        
        // Add new log entry
        const facility = this.facilities.find(f => f.id === device.facilityId);
        const temperature = device.currentTemp!;
        let status: TemperatureLog['status'] = 'Normal';
        
        if (temperature < device.minTemp || temperature > device.maxTemp) {
          status = Math.abs(temperature - device.minTemp) > 2 || Math.abs(temperature - device.maxTemp) > 2 
            ? 'Critical' 
            : 'Warning';
        }
        
        const newLog: TemperatureLog = {
          id: this.temperatureLogs.length + 1,
          deviceId: device.id,
          deviceName: device.name,
          location: device.location,
          facilityId: device.facilityId,
          facilityName: facility?.name || '',
          temperature,
          humidity: Math.floor(Math.random() * 40 + 40),
          timestamp: new Date(),
          minThreshold: device.minTemp,
          maxThreshold: device.maxTemp,
          status,
          alertSent: status !== 'Normal',
          batteryLevel: device.batteryLevel,
          notes: status !== 'Normal' ? `Temperature ${status.toLowerCase()} detected` : undefined
        };
        
        this.temperatureLogs.unshift(newLog);
      }
    });
    
    this.calculateStats();
    this.applyFilters();
    this.saveToLocalStorage();
  }

  exportLogs(format: 'csv' | 'json' | 'pdf'): void {
    const data = this.filteredLogs;
    
    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      this.downloadFile(csv, 'cold-chain-logs.csv', 'text/csv');
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      this.downloadFile(json, 'cold-chain-logs.json', 'application/json');
    } else {
      this.notificationService.info('PDF export will be implemented with a reporting library');
    }
  }

  private convertToCSV(data: TemperatureLog[]): string {
    const headers = ['ID', 'Device', 'Location', 'Facility', 'Temperature', 'Humidity', 'Timestamp', 'Status', 'Alert Sent'];
    const rows = data.map(log => [
      log.id,
      log.deviceName,
      log.location,
      log.facilityName,
      log.temperature,
      log.humidity || '',
      this.formatDate(log.timestamp),
      log.status,
      log.alertSent ? 'Yes' : 'No'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Normal': 'primary',
      'Warning': 'accent',
      'Critical': 'warn',
      'Alarm': 'warn'
    };
    return colors[status] || 'primary';
  }

  getDeviceStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Active': 'primary',
      'Inactive': '',
      'Maintenance': 'accent',
      'Error': 'warn'
    };
    return colors[status] || '';
  }

  getBatteryColor(level?: number): string {
    if (!level) return 'warn';
    if (level > 50) return 'primary';
    if (level > 20) return 'accent';
    return 'warn';
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  }

  formatTemperature(temp: number): string {
    return `${temp.toFixed(1)}°C`;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('coldChainDevices', JSON.stringify(this.devices));
    localStorage.setItem('coldChainLogs', JSON.stringify(this.temperatureLogs));
  }

  private loadFromLocalStorage(): void {
    const savedDevices = localStorage.getItem('coldChainDevices');
    const savedLogs = localStorage.getItem('coldChainLogs');
    
    if (savedDevices) {
      this.devices = JSON.parse(savedDevices);
    }
    
    if (savedLogs) {
      this.temperatureLogs = JSON.parse(savedLogs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        lastReading: log.lastReading ? new Date(log.lastReading) : undefined
      }));
    }
  }
}
