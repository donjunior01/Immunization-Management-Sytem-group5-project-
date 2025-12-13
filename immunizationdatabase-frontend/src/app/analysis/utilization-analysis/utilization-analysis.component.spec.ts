import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UtilizationAnalysisComponent } from './utilization-analysis.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('UtilizationAnalysisComponent', () => {
  let component: UtilizationAnalysisComponent;
  let fixture: ComponentFixture<UtilizationAnalysisComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockUtilization: any = {
    id: 1,
    vaccineName: 'BCG',
    facilityId: 'FAC001',
    facilityName: 'Central Health Center',
    period: 'Jan 2024 - Feb 2024',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-02-01'),
    totalStock: 500,
    administered: 400,
    wastage: 30,
    expired: 20,
    remaining: 50,
    utilizationRate: 80.0,
    wastageRate: 10.0,
    efficiencyScore: 70.0,
    trend: 'Increasing' as const,
    status: 'Good' as const
  };

  beforeEach(async () => {
    const loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [UtilizationAnalysisComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(UtilizationAnalysisComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccineName')).toBeTruthy();
      expect(component.filterForm.get('facilityId')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('trend')).toBeTruthy();
      expect(component.filterForm.get('periodStart')).toBeTruthy();
      expect(component.filterForm.get('periodEnd')).toBeTruthy();
    });
  });

  describe('Data Generation', () => {
    it('should generate mock utilization data', () => {
      component.generateMockData();
      expect(component.utilizationData.length).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', () => {
      component.utilizationData = [mockUtilization];
      component.calculateStats();
      expect(component.stats.totalVaccinesAnalyzed).toBe(1);
      expect(component.stats.averageUtilizationRate).toBe(80.0);
      expect(component.stats.averageWastageRate).toBe(10.0);
    });

    it('should generate trend data', () => {
      component.generateTrendData();
      expect(component.trendData.length).toBe(12);
    });

    it('should generate vaccine performance data', () => {
      component.utilizationData = [mockUtilization];
      component.generateVaccinePerformance();
      expect(component.vaccinePerformance.length).toBeGreaterThan(0);
    });

    it('should generate facility comparison data', () => {
      component.utilizationData = [mockUtilization];
      component.generateFacilityComparison();
      expect(component.facilityComparison.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.utilizationData = [mockUtilization];
    });

    it('should filter by search term', () => {
      component.filterForm.patchValue({ search: 'BCG' });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by vaccine name', () => {
      component.filterForm.patchValue({ vaccineName: 'BCG' });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by facility', () => {
      component.filterForm.patchValue({ facilityId: 'FAC001' });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by status', () => {
      component.filterForm.patchValue({ status: 'Good' });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by trend', () => {
      component.filterForm.patchValue({ trend: 'Increasing' });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by period start', () => {
      component.filterForm.patchValue({ periodStart: new Date('2023-12-01') });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should filter by period end', () => {
      component.filterForm.patchValue({ periodEnd: new Date('2024-12-31') });
      component.applyFilters();
      expect(component.filteredUtilization.length).toBe(1);
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({ search: 'test', vaccineName: 'BCG' });
      component.resetFilters();
      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.vaccineName).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.filteredUtilization = Array(50).fill(null).map((_, i) => ({ ...mockUtilization, id: i + 1 }));
    });

    it('should handle page event', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 50 } as any;
      component.handlePageEvent(event);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should return correct paginated utilization', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      const utilization = component.getPaginatedUtilization();
      expect(utilization.length).toBe(10);
    });
  });

  describe('Detail Operations', () => {
    it('should view utilization details', () => {
      component.viewUtilizationDetails(mockUtilization);
      expect(component.selectedUtilization).toBe(mockUtilization);
      expect(component.showDetailDialog).toBe(true);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.selectedUtilization = mockUtilization;
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBe(false);
      expect(component.selectedUtilization).toBeNull();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.filteredUtilization = [mockUtilization];
    });

    it('should export as CSV', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportUtilization('csv');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to CSV successfully');
    });

    it('should export as JSON', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportUtilization('json');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to JSON successfully');
    });

    it('should show message for PDF export', () => {
      component.exportUtilization('pdf');
      expect(notificationService.info).toHaveBeenCalledWith('PDF export will be implemented with a reporting library');
    });
  });

  describe('Report Generation', () => {
    it('should generate utilization report', (done) => {
      component.generateUtilizationReport();
      expect(loaderService.show).toHaveBeenCalled();
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Utilization analysis report generated successfully');
        done();
      }, 1600);
    });
  });

  describe('Helper Methods', () => {
    it('should get correct status color', () => {
      expect(component.getStatusColor('Excellent')).toBe('primary');
      expect(component.getStatusColor('Good')).toBe('primary');
      expect(component.getStatusColor('Fair')).toBe('accent');
      expect(component.getStatusColor('Poor')).toBe('warn');
    });

    it('should get correct trend color', () => {
      expect(component.getTrendColor('Increasing')).toBe('primary');
      expect(component.getTrendColor('Stable')).toBe('accent');
      expect(component.getTrendColor('Decreasing')).toBe('warn');
    });

    it('should get correct performance color', () => {
      expect(component.getPerformanceColor('Excellent')).toBe('primary');
      expect(component.getPerformanceColor('Good')).toBe('primary');
      expect(component.getPerformanceColor('Fair')).toBe('accent');
      expect(component.getPerformanceColor('Poor')).toBe('warn');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-12-01');
      const formatted = component.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('Dec');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format number correctly', () => {
      expect(component.formatNumber(1500)).toBe('1,500');
      expect(component.formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format period correctly', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-02-01');
      const period = component.formatPeriod(start, end);
      expect(period).toContain('Jan');
      expect(period).toContain('Feb');
    });

    it('should add months correctly', () => {
      const date = new Date('2024-01-01');
      const result = component.addMonths(date, 2);
      expect(result.getMonth()).toBe(2);
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.utilizationData = [mockUtilization];
      
      (component as any).saveToLocalStorage();
      expect(localStorage.setItem).toHaveBeenCalledWith('utilizationAnalysis', jasmine.any(String));
    });

    it('should load from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([mockUtilization]));
      
      (component as any).loadFromLocalStorage();
      expect(component.utilizationData.length).toBe(1);
    });
  });

  describe('Statistics Calculation', () => {
    it('should handle empty data', () => {
      component.utilizationData = [];
      component.calculateStats();
      expect(component.stats.totalVaccinesAnalyzed).toBe(0);
      expect(component.stats.averageUtilizationRate).toBe(0);
      expect(component.stats.averageWastageRate).toBe(0);
    });

    it('should calculate performance counts', () => {
      component.utilizationData = [
        { ...mockUtilization, status: 'Excellent' as const },
        { ...mockUtilization, id: 2, status: 'Good' as const },
        { ...mockUtilization, id: 3, status: 'Fair' as const },
        { ...mockUtilization, id: 4, status: 'Poor' as const }
      ];
      component.calculateStats();
      expect(component.stats.excellentPerformance).toBe(1);
      expect(component.stats.goodPerformance).toBe(1);
      expect(component.stats.fairPerformance).toBe(1);
      expect(component.stats.poorPerformance).toBe(1);
    });

    it('should calculate total doses', () => {
      component.utilizationData = [
        { ...mockUtilization, administered: 100, wastage: 10, expired: 5 },
        { ...mockUtilization, id: 2, administered: 200, wastage: 15, expired: 10 }
      ];
      component.calculateStats();
      expect(component.stats.totalDosesAdministered).toBe(300);
      expect(component.stats.totalDosesWasted).toBe(40);
    });
  });

  describe('Vaccine Performance Analysis', () => {
    it('should calculate vaccine metrics', () => {
      component.utilizationData = [
        { ...mockUtilization, vaccineName: 'BCG', totalStock: 500, administered: 400, wastage: 30, expired: 20 }
      ];
      component.generateVaccinePerformance();
      
      const bcgPerformance = component.vaccinePerformance.find(v => v.vaccineName === 'BCG');
      expect(bcgPerformance).toBeTruthy();
      expect(bcgPerformance?.totalDoses).toBe(500);
      expect(bcgPerformance?.administered).toBe(400);
    });

    it('should generate recommendations', () => {
      component.utilizationData = [
        { ...mockUtilization, vaccineName: 'BCG', totalStock: 500, administered: 300, wastage: 50, expired: 20 }
      ];
      component.generateVaccinePerformance();
      
      const bcgPerformance = component.vaccinePerformance.find(v => v.vaccineName === 'BCG');
      expect(bcgPerformance?.recommendation).toBeTruthy();
    });
  });

  describe('Facility Comparison', () => {
    it('should rank facilities by efficiency', () => {
      component.utilizationData = [
        { ...mockUtilization, facilityId: 'FAC001', totalStock: 500, administered: 450, wastage: 10, expired: 5 },
        { ...mockUtilization, id: 2, facilityId: 'FAC002', totalStock: 500, administered: 300, wastage: 50, expired: 20 }
      ];
      component.generateFacilityComparison();
      
      expect(component.facilityComparison[0].rank).toBe(1);
      expect(component.facilityComparison[0].facilityId).toBe('FAC001');
    });

    it('should assign performance levels', () => {
      component.utilizationData = [
        { ...mockUtilization, facilityId: 'FAC001', totalStock: 500, administered: 450, wastage: 10, expired: 5 }
      ];
      component.generateFacilityComparison();
      
      const facility = component.facilityComparison[0];
      expect(['Excellent', 'Good', 'Fair', 'Poor']).toContain(facility.performance);
    });
  });
});
