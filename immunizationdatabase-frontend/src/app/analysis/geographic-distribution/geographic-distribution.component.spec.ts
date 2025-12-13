import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GeographicDistributionComponent } from './geographic-distribution.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('GeographicDistributionComponent', () => {
  let component: GeographicDistributionComponent;
  let fixture: ComponentFixture<GeographicDistributionComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'info', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [
        GeographicDistributionComponent,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(GeographicDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeDefined();
      expect(component.filterForm.get('level')).toBeDefined();
      expect(component.filterForm.get('status')).toBeDefined();
      expect(component.filterForm.get('trend')).toBeDefined();
      expect(component.filterForm.get('region')).toBeDefined();
      expect(component.filterForm.get('minCoverage')).toBeDefined();
      expect(component.filterForm.get('maxCoverage')).toBeDefined();
    });

    it('should have correct initial filter values', () => {
      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.level).toBe('All');
      expect(component.filterForm.value.status).toBe('All');
      expect(component.filterForm.value.trend).toBe('All');
      expect(component.filterForm.value.region).toBe('All');
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate mock locations data', () => {
      expect(component.locations.length).toBeGreaterThan(0);
    });

    it('should generate locations with all hierarchy levels', () => {
      const national = component.locations.find(l => l.type === 'National');
      const regions = component.locations.filter(l => l.type === 'Region');
      const districts = component.locations.filter(l => l.type === 'District');
      const facilities = component.locations.filter(l => l.type === 'Facility');

      expect(national).toBeDefined();
      expect(regions.length).toBe(5);
      expect(districts.length).toBe(15);
      expect(facilities.length).toBe(30);
    });

    it('should assign correct parent relationships', () => {
      const district = component.locations.find(l => l.type === 'District');
      expect(district?.parentId).toBeDefined();
      expect(district?.parentName).toBeDefined();
    });

    it('should calculate coverage rates correctly', () => {
      component.locations.forEach(location => {
        expect(location.coverageRate).toBeGreaterThanOrEqual(0);
        expect(location.coverageRate).toBeLessThanOrEqual(100);
      });
    });

    it('should assign status based on coverage rate', () => {
      const excellentLocation = component.locations.find(l => l.coverageRate >= 90);
      if (excellentLocation) {
        expect(excellentLocation.status).toBe('Excellent');
      }
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate total locations', () => {
      component['calculateStats']();
      expect(component.stats.totalLocations).toBe(component.filteredLocations.length);
    });

    it('should calculate total facilities', () => {
      component['calculateStats']();
      const facilitiesCount = component.locations.filter(l => l.type === 'Facility').length;
      expect(component.stats.totalFacilities).toBe(facilitiesCount);
    });

    it('should calculate average coverage', () => {
      component['calculateStats']();
      expect(component.stats.averageCoverage).toBeGreaterThan(0);
      expect(component.stats.averageCoverage).toBeLessThanOrEqual(100);
    });

    it('should count locations by status', () => {
      component['calculateStats']();
      const total = component.stats.excellentLocations + 
                   component.stats.goodLocations + 
                   component.stats.fairLocations + 
                   component.stats.poorLocations;
      expect(total).toBe(component.filteredLocations.length);
    });

    it('should identify top and lowest performers', () => {
      component['calculateStats']();
      expect(component.stats.topPerformer).toBeTruthy();
      expect(component.stats.lowestPerformer).toBeTruthy();
    });

    it('should handle empty data', () => {
      component.filteredLocations = [];
      component['calculateStats']();
      expect(component.stats.totalLocations).toBe(0);
    });
  });

  describe('Regional Comparison Analysis', () => {
    it('should analyze regional comparison', () => {
      component['analyzeRegionalComparison']();
      expect(component.regionalComparison.length).toBe(5);
    });

    it('should sort regions by performance score', () => {
      component['analyzeRegionalComparison']();
      for (let i = 0; i < component.regionalComparison.length - 1; i++) {
        expect(component.regionalComparison[i].performanceScore)
          .toBeGreaterThanOrEqual(component.regionalComparison[i + 1].performanceScore);
      }
    });

    it('should include all regional metrics', () => {
      component['analyzeRegionalComparison']();
      component.regionalComparison.forEach(region => {
        expect(region.regionName).toBeDefined();
        expect(region.coverage).toBeDefined();
        expect(region.population).toBeDefined();
        expect(region.facilities).toBeDefined();
        expect(region.vaccinations).toBeDefined();
        expect(region.performanceScore).toBeDefined();
      });
    });
  });

  describe('District Performance Analysis', () => {
    it('should analyze district performance', () => {
      component['analyzeDistrictPerformance']();
      expect(component.districtPerformance.length).toBe(15);
    });

    it('should sort districts by performance score', () => {
      component['analyzeDistrictPerformance']();
      for (let i = 0; i < component.districtPerformance.length - 1; i++) {
        expect(component.districtPerformance[i].performanceScore)
          .toBeGreaterThanOrEqual(component.districtPerformance[i + 1].performanceScore);
      }
    });

    it('should include parent region name', () => {
      component['analyzeDistrictPerformance']();
      component.districtPerformance.forEach(district => {
        expect(district.regionName).toBeTruthy();
      });
    });
  });

  describe('Facility Metrics Analysis', () => {
    it('should analyze facility metrics', () => {
      component['analyzeFacilityMetrics']();
      expect(component.facilityMetrics.length).toBe(30);
    });

    it('should include hierarchical location names', () => {
      component['analyzeFacilityMetrics']();
      component.facilityMetrics.forEach(facility => {
        expect(facility.facilityName).toBeTruthy();
        expect(facility.districtName).toBeDefined();
        expect(facility.regionName).toBeDefined();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by search term', () => {
      const searchTerm = 'Central';
      component.filterForm.patchValue({ search: searchTerm });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            location.code.toLowerCase().includes(searchTerm.toLowerCase());
        expect(matchesSearch).toBeTrue();
      });
    });

    it('should filter by level', () => {
      component.filterForm.patchValue({ level: 'Region' });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        expect(location.type).toBe('Region');
      });
    });

    it('should filter by status', () => {
      component.filterForm.patchValue({ status: 'Excellent' });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        expect(location.status).toBe('Excellent');
      });
    });

    it('should filter by trend', () => {
      component.filterForm.patchValue({ trend: 'Increasing' });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        expect(location.trend.toLowerCase()).toBe('increasing');
      });
    });

    it('should filter by region', () => {
      const region = 'Central';
      component.filterForm.patchValue({ region });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        const matchesRegion = location.name.includes(region) || 
                             location.parentName?.includes(region);
        expect(matchesRegion).toBeTrue();
      });
    });

    it('should filter by minimum coverage', () => {
      const minCoverage = 80;
      component.filterForm.patchValue({ minCoverage });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        expect(location.coverageRate).toBeGreaterThanOrEqual(minCoverage);
      });
    });

    it('should filter by maximum coverage', () => {
      const maxCoverage = 90;
      component.filterForm.patchValue({ maxCoverage });
      component.applyFilters();
      
      component.filteredLocations.forEach(location => {
        expect(location.coverageRate).toBeLessThanOrEqual(maxCoverage);
      });
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({
        search: 'test',
        level: 'Region',
        status: 'Excellent'
      });
      
      component.resetFilters();
      
      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.level).toBe('All');
      expect(component.filterForm.value.status).toBe('All');
    });

    it('should reset page index when filtering', () => {
      component.pageIndex = 2;
      component.applyFilters();
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should handle page change', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 100 };
      component.onPageChange(event);
      
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should return correct paginated data', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      
      const paginated = component.getPaginatedLocations();
      expect(paginated.length).toBeLessThanOrEqual(10);
    });

    it('should handle last page correctly', () => {
      const totalLocations = component.filteredLocations.length;
      const lastPageIndex = Math.floor(totalLocations / component.pageSize);
      
      component.pageIndex = lastPageIndex;
      const paginated = component.getPaginatedLocations();
      
      expect(paginated.length).toBeGreaterThan(0);
      expect(paginated.length).toBeLessThanOrEqual(component.pageSize);
    });
  });

  describe('Detail Operations', () => {
    it('should view location details', () => {
      const location = component.locations[0];
      component.viewLocationDetails(location);
      
      expect(component.selectedLocation).toBe(location);
      expect(component.showDetailDialog).toBeTrue();
    });

    it('should close detail dialog', () => {
      component.selectedLocation = component.locations[0];
      component.showDetailDialog = true;
      
      component.closeDetailDialog();
      
      expect(component.selectedLocation).toBeNull();
      expect(component.showDetailDialog).toBeFalse();
    });
  });

  describe('View Management', () => {
    it('should change view to hierarchy', () => {
      component.changeView('hierarchy');
      expect(component.selectedView).toBe('hierarchy');
    });

    it('should change view to comparison', () => {
      component.changeView('comparison');
      expect(component.selectedView).toBe('comparison');
    });

    it('should change view to performance', () => {
      component.changeView('performance');
      expect(component.selectedView).toBe('performance');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should export as CSV', () => {
      component.exportData('csv');
      expect(loaderService.show).toHaveBeenCalled();
      
      jasmine.clock().tick(1001);
      
      expect(notificationService.success).toHaveBeenCalledWith('Geographic data exported as CSV');
    });

    it('should export as JSON', () => {
      component.exportData('json');
      expect(loaderService.show).toHaveBeenCalled();
      
      jasmine.clock().tick(1001);
      
      expect(notificationService.success).toHaveBeenCalledWith('Geographic data exported as JSON');
    });

    it('should show info for PDF export', () => {
      component.exportData('pdf');
      expect(loaderService.show).toHaveBeenCalled();
      
      jasmine.clock().tick(1001);
      
      expect(notificationService.info).toHaveBeenCalledWith('PDF export functionality would be implemented here');
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should generate report', () => {
      component.generateReport();
      expect(loaderService.show).toHaveBeenCalled();
      
      jasmine.clock().tick(2001);
      
      expect(notificationService.success).toHaveBeenCalledWith('Geographic distribution report generated successfully');
    });
  });

  describe('Helper Methods', () => {
    it('should get correct status color', () => {
      expect(component.getStatusColor('Excellent')).toBe('primary');
      expect(component.getStatusColor('Good')).toBe('accent');
      expect(component.getStatusColor('Fair')).toBe('warn');
      expect(component.getStatusColor('Poor')).toBe('warn');
    });

    it('should get correct trend icon', () => {
      expect(component.getTrendIcon('increasing')).toBe('trending_up');
      expect(component.getTrendIcon('stable')).toBe('trending_flat');
      expect(component.getTrendIcon('decreasing')).toBe('trending_down');
    });

    it('should get correct trend color', () => {
      expect(component.getTrendColor('increasing')).toBe('#4caf50');
      expect(component.getTrendColor('stable')).toBe('#ff9800');
      expect(component.getTrendColor('decreasing')).toBe('#f44336');
    });

    it('should get correct type icon', () => {
      expect(component.getTypeIcon('National')).toBe('public');
      expect(component.getTypeIcon('Region')).toBe('location_city');
      expect(component.getTypeIcon('District')).toBe('domain');
      expect(component.getTypeIcon('Facility')).toBe('local_hospital');
    });

    it('should format large numbers correctly', () => {
      expect(component.formatNumber(5000000)).toContain('M');
      expect(component.formatNumber(50000)).toContain('K');
      expect(component.formatNumber(500)).toBe('500');
    });

    it('should format percentage correctly', () => {
      const result = component.formatPercentage(85.5);
      expect(result).toContain('85.5');
      expect(result).toContain('%');
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component['saveToLocalStorage']();
      expect(localStorage.setItem).toHaveBeenCalledWith('geographic-locations', jasmine.any(String));
    });

    it('should load from localStorage', () => {
      const mockData = JSON.stringify([{
        id: 'TEST-1',
        type: 'Region',
        name: 'Test Region',
        code: 'TEST-001',
        level: 1,
        population: 1000000,
        targetPopulation: 100000,
        facilities: 10,
        healthWorkers: 50,
        vaccinesAdministered: 90000,
        coverageRate: 90,
        performanceScore: 92,
        rank: 1,
        trend: 'increasing',
        status: 'Excellent',
        lastUpdated: new Date().toISOString()
      }]);
      
      spyOn(localStorage, 'getItem').and.returnValue(mockData);
      component['loadFromLocalStorage']();
      
      expect(component.locations.length).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');
      expect(() => component['loadFromLocalStorage']()).not.toThrow();
    });
  });
});
