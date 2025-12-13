import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { StockAlertsComponent } from './stock-alerts.component';

describe('StockAlertsComponent', () => {
  let component: StockAlertsComponent;
  let fixture: ComponentFixture<StockAlertsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockAlertsComponent, BrowserAnimationsModule],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(StockAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alerts data on init', () => {
    spyOn(component, 'loadAlertsData');
    component.ngOnInit();
    expect(component.loadAlertsData).toHaveBeenCalled();
  });

  it('should calculate KPIs correctly', () => {
    component.alerts = [
      {
        id: 1,
        type: 'LOW_STOCK',
        severity: 'CRITICAL',
        vaccineName: 'BCG',
        batchNumber: 'BCG-2024-001',
        message: 'Critical low stock',
        quantity: 10,
        createdAt: '2024-12-11',
        status: 'UNREAD'
      },
      {
        id: 2,
        type: 'EXPIRING',
        severity: 'HIGH',
        vaccineName: 'OPV',
        batchNumber: 'OPV-2024-001',
        message: 'Expiring soon',
        daysRemaining: 5,
        createdAt: '2024-12-11',
        status: 'READ'
      },
      {
        id: 3,
        type: 'EXPIRED',
        severity: 'CRITICAL',
        vaccineName: 'DTP',
        batchNumber: 'DTP-2024-001',
        message: 'Expired',
        daysRemaining: -5,
        createdAt: '2024-12-10',
        status: 'RESOLVED',
        resolvedAt: '2024-12-11',
        resolvedBy: 'Test User'
      }
    ];

    component.calculateKPIs();

    expect(component.kpis.totalAlerts).toBe(2); // Excludes resolved
    expect(component.kpis.criticalAlerts).toBe(1); // Only ID 1
    expect(component.kpis.pendingActions).toBe(2); // UNREAD and READ
    expect(component.kpis.resolvedToday).toBe(1); // ID 3 resolved today
  });

  it('should apply filters correctly', () => {
    component.alerts = [
      {
        id: 1,
        type: 'LOW_STOCK',
        severity: 'CRITICAL',
        vaccineName: 'BCG',
        batchNumber: 'BCG-2024-001',
        message: 'Critical low stock',
        createdAt: '2024-12-11',
        status: 'UNREAD'
      },
      {
        id: 2,
        type: 'EXPIRING',
        severity: 'HIGH',
        vaccineName: 'OPV',
        batchNumber: 'OPV-2024-001',
        message: 'Expiring soon',
        createdAt: '2024-12-11',
        status: 'READ'
      }
    ];

    component.searchTerm = 'BCG';
    component.applyFilters();
    expect(component.filteredAlerts.length).toBe(1);
    expect(component.filteredAlerts[0].vaccineName).toBe('BCG');

    component.searchTerm = '';
    component.selectedSeverity = 'CRITICAL';
    component.applyFilters();
    expect(component.filteredAlerts.length).toBe(1);
    expect(component.filteredAlerts[0].severity).toBe('CRITICAL');

    component.selectedSeverity = '';
    component.selectedAlertType = 'EXPIRING';
    component.applyFilters();
    expect(component.filteredAlerts.length).toBe(1);
    expect(component.filteredAlerts[0].type).toBe('EXPIRING');
  });

  it('should toggle alert selection', () => {
    component.toggleSelect(1);
    expect(component.isSelected(1)).toBe(true);

    component.toggleSelect(1);
    expect(component.isSelected(1)).toBe(false);
  });

  it('should perform bulk resolve action', () => {
    component.alerts = [
      {
        id: 1,
        type: 'LOW_STOCK',
        severity: 'CRITICAL',
        vaccineName: 'BCG',
        batchNumber: 'BCG-2024-001',
        message: 'Critical low stock',
        createdAt: '2024-12-11',
        status: 'UNREAD'
      }
    ];
    component.selectedAlerts.add(1);

    spyOn(component['loaderService'], 'show');
    spyOn(component['loaderService'], 'hide');
    spyOn(component['notificationService'], 'showSuccess');

    component.bulkResolve();

    setTimeout(() => {
      expect(component.alerts[0].status).toBe('RESOLVED');
      expect(component.alerts[0].resolvedAt).toBeDefined();
      expect(component.alerts[0].resolvedBy).toBeDefined();
      expect(component.selectedAlerts.size).toBe(0);
      expect(component['notificationService'].showSuccess).toHaveBeenCalled();
    }, 1100);
  });

  it('should export alerts report', () => {
    spyOn(component, 'generateAlertsCSV').and.returnValue('mock,csv,data');
    spyOn(URL, 'createObjectURL').and.returnValue('mock-url');
    spyOn(URL, 'revokeObjectURL');

    const linkElement = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(linkElement);
    spyOn(linkElement, 'click');
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    component.exportAlertsReport();

    setTimeout(() => {
      expect(component.generateAlertsCSV).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(linkElement.click).toHaveBeenCalled();
    }, 1100);
  });
});
