import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockReportComponent } from './stock-report.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

describe('StockReportComponent', () => {
  let component: StockReportComponent;
  let fixture: ComponentFixture<StockReportComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [StockReportComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockReportComponent);
    component = fixture.componentInstance;
    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stock report on init', () => {
    spyOn(component, 'loadStockReport');
    component.ngOnInit();
    expect(component.loadStockReport).toHaveBeenCalled();
  });

  it('should load KPIs correctly', () => {
    component.loadKPIs();
    expect(component.kpis.totalConsumption).toBe(4567);
    expect(component.kpis.wastageRate).toBe(3.2);
    expect(component.kpis.stockTurnover).toBe(8.5);
    expect(component.kpis.reorderFrequency).toBe(12);
    expect(component.kpis.averageUsage).toBe(763);
    expect(component.kpis.utilizationRate).toBe(94.8);
  });

  it('should load usage patterns with 6 vaccines', () => {
    component.loadUsagePatterns();
    expect(component.usagePatterns.length).toBe(6);
    expect(component.usagePatterns[0].vaccineName).toBe('BCG');
    expect(component.usagePatterns[5].vaccineName).toBe('Polio');
  });

  it('should load wastage data with severity levels', () => {
    component.loadWastageData();
    expect(component.wastageData.length).toBe(6);
    expect(component.wastageData.find(w => w.severity === 'HIGH')).toBeDefined();
    expect(component.wastageData.find(w => w.severity === 'LOW')).toBeDefined();
  });

  it('should load turnover data with status', () => {
    component.loadTurnoverData();
    expect(component.turnoverData.length).toBe(6);
    expect(component.turnoverData.find(t => t.status === 'OPTIMAL')).toBeDefined();
    expect(component.turnoverData.find(t => t.status === 'SLOW')).toBeDefined();
    expect(component.turnoverData.find(t => t.status === 'FAST')).toBeDefined();
  });

  it('should load 6 months of usage data', () => {
    component.loadMonthlyUsage();
    expect(component.monthlyUsage.length).toBe(6);
    expect(component.monthlyUsage[0].month).toBe('Jul 2024');
    expect(component.monthlyUsage[5].month).toBe('Dec 2024');
  });

  it('should load reorder analytics with urgency levels', () => {
    component.loadReorderAnalytics();
    expect(component.reorderAnalytics.length).toBe(6);
    expect(component.reorderAnalytics.find(r => r.status === 'URGENT')).toBeDefined();
    expect(component.reorderAnalytics.find(r => r.status === 'NORMAL')).toBeDefined();
  });

  it('should load stock movements', () => {
    component.loadStockMovements();
    expect(component.stockMovements.length).toBe(8);
    expect(component.stockMovements.find(m => m.movementType === 'IN')).toBeDefined();
    expect(component.stockMovements.find(m => m.movementType === 'OUT')).toBeDefined();
    expect(component.stockMovements.find(m => m.movementType === 'WASTE')).toBeDefined();
  });

  it('should apply filters and show success notification', (done) => {
    loaderService.show.and.returnValue();
    notificationService.success.and.returnValue();

    component.applyFilters();
    
    setTimeout(() => {
      expect(loaderService.show).toHaveBeenCalledWith(800);
      expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
      done();
    }, 850);
  });

  it('should reset filters and reapply', () => {
    component.startDate = new Date();
    component.endDate = new Date();
    component.selectedVaccine = 'BCG';
    component.selectedPeriod = 'last-month';

    spyOn(component, 'applyFilters');
    component.resetFilters();

    expect(component.startDate).toBeNull();
    expect(component.endDate).toBeNull();
    expect(component.selectedVaccine).toBe('');
    expect(component.selectedPeriod).toBe('last-3-months');
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should return correct trend icon', () => {
    expect(component.getTrendIcon('UP')).toBe('trending_up');
    expect(component.getTrendIcon('DOWN')).toBe('trending_down');
    expect(component.getTrendIcon('STABLE')).toBe('trending_flat');
  });

  it('should return correct trend class', () => {
    expect(component.getTrendClass('UP')).toBe('trend-up');
    expect(component.getTrendClass('DOWN')).toBe('trend-down');
    expect(component.getTrendClass('STABLE')).toBe('trend-stable');
  });

  it('should return correct severity class', () => {
    expect(component.getSeverityClass('HIGH')).toBe('severity-high');
    expect(component.getSeverityClass('MEDIUM')).toBe('severity-medium');
    expect(component.getSeverityClass('LOW')).toBe('severity-low');
  });

  it('should return correct turnover status class', () => {
    expect(component.getTurnoverStatusClass('OPTIMAL')).toBe('turnover-optimal');
    expect(component.getTurnoverStatusClass('FAST')).toBe('turnover-fast');
    expect(component.getTurnoverStatusClass('SLOW')).toBe('turnover-slow');
  });

  it('should return correct reorder status class', () => {
    expect(component.getReorderStatusClass('URGENT')).toBe('reorder-urgent');
    expect(component.getReorderStatusClass('WATCH')).toBe('reorder-watch');
    expect(component.getReorderStatusClass('NORMAL')).toBe('reorder-normal');
  });

  it('should return correct movement type class', () => {
    expect(component.getMovementTypeClass('IN')).toBe('movement-in');
    expect(component.getMovementTypeClass('OUT')).toBe('movement-out');
    expect(component.getMovementTypeClass('WASTE')).toBe('movement-waste');
  });

  it('should generate CSV report', () => {
    spyOn(document, 'createElement').and.callThrough();
    component.loadUsagePatterns();
    component.loadWastageData();
    component.loadTurnoverData();
    component.loadReorderAnalytics();

    component.generateCSV();

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(notificationService.success).toHaveBeenCalledWith('CSV report downloaded successfully');
  });

  it('should show info message for PDF generation', () => {
    component.generatePDF();
    expect(notificationService.info).toHaveBeenCalledWith('PDF generation would require additional library (e.g., jsPDF)');
  });

  it('should refresh report', () => {
    spyOn(component, 'loadStockReport');
    component.refreshReport();
    expect(component.loadStockReport).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Report refreshed successfully');
  });

  it('should generate reorder list with urgent vaccines', () => {
    component.loadReorderAnalytics();
    component.generateReorderList();
    expect(notificationService.info).toHaveBeenCalledWith('2 vaccine(s) need reordering');
  });

  it('should show success when no reorders needed', () => {
    component.reorderAnalytics = [
      { vaccineName: 'BCG', currentStock: 450, reorderLevel: 150, optimalOrder: 500, leadTime: 14, lastOrderDate: '2024-11-15', nextOrderDue: '2025-01-20', status: 'NORMAL' }
    ];
    component.generateReorderList();
    expect(notificationService.success).toHaveBeenCalledWith('All stock levels are normal');
  });
});
