import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FacilityComparisonComponent } from './facility-comparison.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

describe('FacilityComparisonComponent', () => {
  let component: FacilityComparisonComponent;
  let fixture: ComponentFixture<FacilityComparisonComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    await TestBed.configureTestingModule({
      imports: [FacilityComparisonComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(FacilityComparisonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load comparison data on init', () => {
    spyOn(component, 'loadComparisonData');
    component.ngOnInit();
    expect(component.loadComparisonData).toHaveBeenCalled();
  });

  it('should load KPIs correctly', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.kpis.averageCoverage).toBe(84.3);
      expect(component.kpis.averageStockLevel).toBe(78.5);
      expect(component.kpis.averageWastage).toBe(4.2);
      expect(component.kpis.totalFacilities).toBe(14);
      done();
    }, 1100);
  });

  it('should load facility metrics with 8 facilities', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.facilityMetrics.length).toBe(8);
      expect(component.facilityMetrics[0].facilityName).toBe('Central Health Center');
      expect(component.facilityMetrics[0].rank).toBe(1);
      expect(component.facilityMetrics[7].facilityName).toBe('Remote Health Station');
      expect(component.facilityMetrics[7].rank).toBe(8);
      done();
    }, 1100);
  });

  it('should load performance categories', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.performanceCategories.length).toBe(6);
      expect(component.performanceCategories[0].category).toBe('Vaccination Coverage');
      expect(component.performanceCategories[0].topFacility).toBe('Central Health Center');
      done();
    }, 1100);
  });

  it('should load best practices with verified status', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.bestPractices.length).toBe(6);
      const verifiedPractices = component.bestPractices.filter(p => p.status === 'VERIFIED');
      const pilotPractices = component.bestPractices.filter(p => p.status === 'PILOT');
      expect(verifiedPractices.length).toBeGreaterThan(0);
      expect(pilotPractices.length).toBeGreaterThan(0);
      done();
    }, 1100);
  });

  it('should load district comparison with 4 districts', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.districtComparison.length).toBe(4);
      expect(component.districtComparison[0].district).toBe('DIST001');
      expect(component.districtComparison[0].rank).toBe(1);
      done();
    }, 1100);
  });

  it('should load metric comparison with 6 metrics', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.metricComparison.length).toBe(6);
      const aboveMetrics = component.metricComparison.filter(m => m.status === 'ABOVE');
      const betterMetrics = component.metricComparison.filter(m => m.status === 'BETTER');
      expect(aboveMetrics.length).toBeGreaterThan(0);
      expect(betterMetrics.length).toBeGreaterThan(0);
      done();
    }, 1100);
  });

  it('should load 6 months of trend data', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      expect(component.trendData.length).toBe(6);
      expect(component.trendData[0].month).toBe('Jul 2024');
      expect(component.trendData[5].month).toBe('Dec 2024');
      done();
    }, 1100);
  });

  it('should apply filters and show success notification', (done) => {
    component.selectedDistrict = 'DIST001';
    component.selectedMetric = 'stock';
    component.applyFilters();
    
    expect(loaderService.show).toHaveBeenCalledWith(800);
    
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
      done();
    }, 900);
  });

  it('should reset filters and reapply', () => {
    component.selectedDistrict = 'DIST001';
    component.selectedMetric = 'stock';
    component.selectedPeriod = 'last-year';
    
    spyOn(component, 'applyFilters');
    component.resetFilters();
    
    expect(component.selectedDistrict).toBe('');
    expect(component.selectedMetric).toBe('coverage');
    expect(component.selectedPeriod).toBe('last-6-months');
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should return correct rank class', () => {
    expect(component.getRankClass(1)).toBe('rank-gold');
    expect(component.getRankClass(2)).toBe('rank-silver');
    expect(component.getRankClass(3)).toBe('rank-bronze');
    expect(component.getRankClass(4)).toBe('rank-default');
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

  it('should return correct score class', () => {
    expect(component.getScoreClass(95)).toBe('score-excellent');
    expect(component.getScoreClass(85)).toBe('score-good');
    expect(component.getScoreClass(75)).toBe('score-fair');
    expect(component.getScoreClass(65)).toBe('score-poor');
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('ABOVE')).toBe('status-above');
    expect(component.getStatusClass('BETTER')).toBe('status-better');
    expect(component.getStatusClass('BELOW')).toBe('status-below');
  });

  it('should return correct practice status class', () => {
    expect(component.getPracticeStatusClass('VERIFIED')).toBe('practice-verified');
    expect(component.getPracticeStatusClass('PILOT')).toBe('practice-pilot');
    expect(component.getPracticeStatusClass('PROPOSED')).toBe('practice-proposed');
  });

  it('should return correct performance color', () => {
    expect(component.getPerformanceColor(95)).toBe('#27ae60');
    expect(component.getPerformanceColor(85)).toBe('#3498db');
    expect(component.getPerformanceColor(75)).toBe('#f39c12');
    expect(component.getPerformanceColor(65)).toBe('#e74c3c');
  });

  it('should generate CSV report', (done) => {
    component.loadComparisonData();
    
    setTimeout(() => {
      spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click')
      } as any);
      
      component.exportReport('csv');
      
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('CSV report downloaded successfully');
        done();
      }, 1100);
    }, 1100);
  });

  it('should show info message for PDF generation', (done) => {
    component.exportReport('pdf');
    
    setTimeout(() => {
      expect(notificationService.info).toHaveBeenCalledWith('PDF generation would require additional library (e.g., jsPDF)');
      done();
    }, 1100);
  });

  it('should refresh report', () => {
    spyOn(component, 'loadComparisonData');
    component.refreshReport();
    
    expect(component.loadComparisonData).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Report refreshed successfully');
  });

  it('should view facility details', () => {
    component.viewFacilityDetails('FAC001');
    expect(notificationService.info).toHaveBeenCalledWith('Viewing details for FAC001');
  });

  it('should adopt best practice', () => {
    const practice = {
      facilityName: 'Central Health Center',
      category: 'Stock Management',
      practice: 'Real-time inventory tracking',
      impact: 'Reduced stockouts by 45%',
      metrics: 'Stock availability: 98%',
      status: 'VERIFIED'
    };
    
    component.adoptBestPractice(practice);
    expect(notificationService.success).toHaveBeenCalledWith('Best practice "Real-time inventory tracking" marked for adoption');
  });
});
