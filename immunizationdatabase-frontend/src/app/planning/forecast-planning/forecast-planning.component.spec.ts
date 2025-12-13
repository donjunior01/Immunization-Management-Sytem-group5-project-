import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForecastPlanningComponent } from './forecast-planning.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('ForecastPlanningComponent', () => {
  let component: ForecastPlanningComponent;
  let fixture: ComponentFixture<ForecastPlanningComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockForecast: any = {
    id: 1,
    vaccineName: 'BCG',
    currentStock: 200,
    averageDailyUsage: 10,
    forecastPeriod: 30,
    predictedDemand: 300,
    recommendedOrder: 150,
    stockoutRisk: 'Medium' as const,
    estimatedCost: 1500,
    supplier: 'Serum Institute of India',
    leadTime: 14,
    lastOrderDate: new Date('2024-11-01'),
    expiryBuffer: 30,
    seasonalFactor: 1.0,
    trendFactor: 1.0,
    campaignImpact: 0,
    confidenceLevel: 85
  };

  beforeEach(async () => {
    const loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [ForecastPlanningComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(ForecastPlanningComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccineName')).toBeTruthy();
      expect(component.filterForm.get('stockoutRisk')).toBeTruthy();
      expect(component.filterForm.get('supplier')).toBeTruthy();
    });

    it('should initialize forecast form with correct controls', () => {
      expect(component.forecastForm.get('vaccineName')).toBeTruthy();
      expect(component.forecastForm.get('currentStock')).toBeTruthy();
      expect(component.forecastForm.get('averageDailyUsage')).toBeTruthy();
      expect(component.forecastForm.get('forecastPeriod')).toBeTruthy();
      expect(component.forecastForm.get('supplier')).toBeTruthy();
      expect(component.forecastForm.get('leadTime')).toBeTruthy();
    });

    it('should initialize scenario form with correct controls', () => {
      expect(component.scenarioForm.get('name')).toBeTruthy();
      expect(component.scenarioForm.get('description')).toBeTruthy();
      expect(component.scenarioForm.get('demandIncrease')).toBeTruthy();
      expect(component.scenarioForm.get('budgetConstraint')).toBeTruthy();
      expect(component.scenarioForm.get('feasibility')).toBeTruthy();
    });
  });

  describe('Data Generation', () => {
    it('should generate mock forecast data', () => {
      component.generateMockData();
      expect(component.forecasts.length).toBeGreaterThan(0);
    });

    it('should generate demand predictions', () => {
      component.generateDemandPredictions();
      expect(component.demandPredictions.length).toBe(6);
    });

    it('should generate resource allocations', () => {
      component.generateResourceAllocations();
      expect(component.resourceAllocations.length).toBe(5);
    });

    it('should generate scenarios', () => {
      component.generateScenarios();
      expect(component.scenarios.length).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', () => {
      component.forecasts = [mockForecast];
      component.calculateStats();
      expect(component.stats.totalPredictedDemand).toBe(300);
      expect(component.stats.totalRecommendedOrder).toBe(150);
      expect(component.stats.totalEstimatedCost).toBe(1500);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.forecasts = [mockForecast];
    });

    it('should filter by search term', () => {
      component.filterForm.patchValue({ search: 'BCG' });
      component.applyFilters();
      expect(component.filteredForecasts.length).toBe(1);
    });

    it('should filter by vaccine name', () => {
      component.filterForm.patchValue({ vaccineName: 'BCG' });
      component.applyFilters();
      expect(component.filteredForecasts.length).toBe(1);
    });

    it('should filter by stockout risk', () => {
      component.filterForm.patchValue({ stockoutRisk: 'Medium' });
      component.applyFilters();
      expect(component.filteredForecasts.length).toBe(1);
    });

    it('should filter by supplier', () => {
      component.filterForm.patchValue({ supplier: 'Serum Institute of India' });
      component.applyFilters();
      expect(component.filteredForecasts.length).toBe(1);
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
      component.filteredForecasts = Array(50).fill(null).map((_, i) => ({ ...mockForecast, id: i + 1 }));
    });

    it('should handle page event', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 50 } as any;
      component.handlePageEvent(event);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should return correct paginated forecasts', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      const forecasts = component.getPaginatedForecasts();
      expect(forecasts.length).toBe(10);
    });
  });

  describe('Forecast Management', () => {
    it('should open create forecast dialog', () => {
      component.openForecastDialog();
      expect(component.showForecastDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should open edit forecast dialog', () => {
      component.openForecastDialog(mockForecast);
      expect(component.showForecastDialog).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedForecast).toBe(mockForecast);
    });

    it('should close forecast dialog', () => {
      component.showForecastDialog = true;
      component.closeForecastDialog();
      expect(component.showForecastDialog).toBe(false);
      expect(component.selectedForecast).toBeNull();
    });

    it('should save new forecast', () => {
      spyOn(localStorage, 'setItem');
      component.forecastForm.patchValue({
        vaccineName: 'BCG',
        currentStock: 200,
        averageDailyUsage: 10,
        forecastPeriod: 30,
        supplier: 'Serum Institute of India',
        leadTime: 14,
        expiryBuffer: 30,
        seasonalFactor: 1.0,
        trendFactor: 1.0,
        campaignImpact: 0
      });

      component.saveForecast();
      expect(component.forecasts.length).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Forecast created successfully');
    });

    it('should update existing forecast', () => {
      spyOn(localStorage, 'setItem');
      component.isEditMode = true;
      component.selectedForecast = mockForecast;
      component.forecastForm.patchValue({
        ...mockForecast,
        currentStock: 300
      });

      component.saveForecast();
      expect(notificationService.success).toHaveBeenCalledWith('Forecast updated successfully');
    });

    it('should not save with invalid form', () => {
      component.forecastForm.reset();
      component.saveForecast();
      expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should delete forecast', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(localStorage, 'setItem');
      component.forecasts = [mockForecast];

      component.deleteForecast(mockForecast);
      expect(component.forecasts.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalledWith('Forecast deleted successfully');
    });

    it('should not delete when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.forecasts = [mockForecast];

      component.deleteForecast(mockForecast);
      expect(component.forecasts.length).toBe(1);
    });
  });

  describe('Form Validation', () => {
    it('should require vaccine name', () => {
      const control = component.forecastForm.get('vaccineName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require current stock', () => {
      const control = component.forecastForm.get('currentStock');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate current stock minimum value', () => {
      const control = component.forecastForm.get('currentStock');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should require average daily usage', () => {
      const control = component.forecastForm.get('averageDailyUsage');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate average daily usage minimum value', () => {
      const control = component.forecastForm.get('averageDailyUsage');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should require forecast period', () => {
      const control = component.forecastForm.get('forecastPeriod');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require supplier', () => {
      const control = component.forecastForm.get('supplier');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require lead time', () => {
      const control = component.forecastForm.get('leadTime');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('Forecast Details', () => {
    it('should view forecast details', () => {
      component.viewForecastDetails(mockForecast);
      expect(component.selectedForecast).toBe(mockForecast);
      expect(component.showDetailDialog).toBe(true);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.selectedForecast = mockForecast;
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBe(false);
      expect(component.selectedForecast).toBeNull();
    });
  });

  describe('Scenario Management', () => {
    it('should open scenario dialog', () => {
      component.openScenarioDialog();
      expect(component.showScenarioDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should close scenario dialog', () => {
      component.showScenarioDialog = true;
      component.closeScenarioDialog();
      expect(component.showScenarioDialog).toBe(false);
      expect(component.selectedScenario).toBeNull();
    });

    it('should save new scenario', () => {
      component.scenarioForm.patchValue({
        name: 'Test Scenario',
        description: 'Test Description',
        demandIncrease: 20,
        budgetConstraint: 100000,
        feasibility: 'High'
      });

      component.saveScenario();
      expect(component.scenarios.length).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Scenario created successfully');
    });

    it('should not save scenario with invalid form', () => {
      component.scenarioForm.reset();
      component.saveScenario();
      expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.filteredForecasts = [mockForecast];
    });

    it('should export as CSV', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportForecasts('csv');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to CSV successfully');
    });

    it('should export as JSON', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportForecasts('json');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to JSON successfully');
    });

    it('should show message for PDF export', () => {
      component.exportForecasts('pdf');
      expect(notificationService.info).toHaveBeenCalledWith('PDF export will be implemented with a reporting library');
    });
  });

  describe('Helper Methods', () => {
    it('should get correct risk color', () => {
      expect(component.getRiskColor('Critical')).toBe('warn');
      expect(component.getRiskColor('High')).toBe('warn');
      expect(component.getRiskColor('Medium')).toBe('accent');
      expect(component.getRiskColor('Low')).toBe('primary');
    });

    it('should get correct priority color', () => {
      expect(component.getPriorityColor('High')).toBe('warn');
      expect(component.getPriorityColor('Medium')).toBe('accent');
      expect(component.getPriorityColor('Low')).toBe('primary');
    });

    it('should get correct feasibility color', () => {
      expect(component.getFeasibilityColor('High')).toBe('primary');
      expect(component.getFeasibilityColor('Medium')).toBe('accent');
      expect(component.getFeasibilityColor('Low')).toBe('warn');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-12-01');
      const formatted = component.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('12');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format currency correctly', () => {
      expect(component.formatCurrency(1500)).toBe('$1500.00');
      expect(component.formatCurrency(123.456)).toBe('$123.46');
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.forecasts = [mockForecast];
      
      (component as any).saveToLocalStorage();
      expect(localStorage.setItem).toHaveBeenCalledWith('vaccineForecasts', jasmine.any(String));
    });

    it('should load from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([mockForecast]));
      
      (component as any).loadFromLocalStorage();
      expect(component.forecasts.length).toBe(1);
    });
  });
});
