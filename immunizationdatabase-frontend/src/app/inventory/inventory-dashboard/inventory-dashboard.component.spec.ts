import { TestBed } from '@angular/core/testing';
import { InventoryDashboardComponent } from './inventory-dashboard.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('InventoryDashboardComponent', () => {
  let component: InventoryDashboardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InventoryDashboardComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(InventoryDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load inventory data on init', () => {
    component.ngOnInit();
    expect(component.batches.length).toBeGreaterThan(0);
    expect(component.vaccineCategories.length).toBeGreaterThan(0);
    expect(component.kpis.totalBatches).toBeGreaterThan(0);
  });

  it('should calculate KPIs correctly', () => {
    component.batches = [
      {
        id: 1,
        batchNumber: 'TEST-001',
        vaccineName: 'BCG',
        manufacturer: 'Test Mfg',
        quantityReceived: 100,
        quantityRemaining: 50,
        expiryDate: '2025-12-31',
        receiptDate: '2024-01-01',
        facilityId: 'FAC001',
        status: 'GOOD',
        daysUntilExpiry: 385,
        utilizationPercent: 50
      },
      {
        id: 2,
        batchNumber: 'TEST-002',
        vaccineName: 'OPV',
        manufacturer: 'Test Mfg',
        quantityReceived: 200,
        quantityRemaining: 20,
        expiryDate: '2025-01-05',
        receiptDate: '2024-01-01',
        facilityId: 'FAC001',
        status: 'LOW_STOCK',
        daysUntilExpiry: 25,
        utilizationPercent: 90
      }
    ];

    component.calculateKPIs();

    expect(component.kpis.totalBatches).toBe(2);
    expect(component.kpis.activeVaccines).toBe(2);
    expect(component.kpis.lowStockAlerts).toBe(1);
    expect(component.kpis.totalDoses).toBe(70);
  });

  it('should filter batches correctly', () => {
    component.batches = [
      {
        id: 1,
        batchNumber: 'BCG-001',
        vaccineName: 'BCG',
        manufacturer: 'Test Mfg',
        quantityReceived: 100,
        quantityRemaining: 50,
        expiryDate: '2025-12-31',
        receiptDate: '2024-01-01',
        facilityId: 'FAC001',
        status: 'GOOD',
        daysUntilExpiry: 385,
        utilizationPercent: 50
      },
      {
        id: 2,
        batchNumber: 'OPV-001',
        vaccineName: 'OPV',
        manufacturer: 'Test Mfg',
        quantityReceived: 200,
        quantityRemaining: 20,
        expiryDate: '2025-01-05',
        receiptDate: '2024-01-01',
        facilityId: 'FAC001',
        status: 'LOW_STOCK',
        daysUntilExpiry: 25,
        utilizationPercent: 90
      }
    ];

    component.selectedVaccine = 'BCG';
    component.applyFilters();

    expect(component.filteredBatches.length).toBe(1);
    expect(component.filteredBatches[0].vaccineName).toBe('BCG');
  });

  it('should return correct status icon', () => {
    expect(component.getStatusIcon('GOOD')).toBe('check_circle');
    expect(component.getStatusIcon('LOW_STOCK')).toBe('warning');
    expect(component.getStatusIcon('EXPIRING_SOON')).toBe('schedule');
    expect(component.getStatusIcon('EXPIRED')).toBe('cancel');
  });

  it('should export inventory report to CSV', async () => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window.URL, 'revokeObjectURL');
    const clickSpy = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({ click: clickSpy } as any);

    component.exportInventoryReport();

    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
