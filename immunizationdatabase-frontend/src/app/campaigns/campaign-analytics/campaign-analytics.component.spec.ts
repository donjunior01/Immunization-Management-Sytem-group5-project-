import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampaignAnalyticsComponent } from './campaign-analytics.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('CampaignAnalyticsComponent', () => {
  let component: CampaignAnalyticsComponent;
  let fixture: ComponentFixture<CampaignAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CampaignAnalyticsComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load analytics data on init', () => {
    expect(component.campaigns.length).toBeGreaterThan(0);
    expect(component.kpis).toBeDefined();
    expect(component.vaccineDistribution.length).toBeGreaterThan(0);
  });

  it('should calculate KPIs correctly', () => {
    component.campaigns = [
      { id: 1, name: 'Test 1', vaccineName: 'BCG', targetPopulation: 100, vaccinatedCount: 80, coveragePercent: 80, status: 'ACTIVE', startDate: '2024-01-01', endDate: '2024-12-31', daysRemaining: 30, facilityName: 'Test Facility', scope: 'FACILITY' },
      { id: 2, name: 'Test 2', vaccineName: 'OPV', targetPopulation: 200, vaccinatedCount: 150, coveragePercent: 75, status: 'COMPLETED', startDate: '2024-01-01', endDate: '2024-06-30', daysRemaining: 0, facilityName: 'Test Facility', scope: 'DISTRICT' }
    ];
    
    component.calculateKPIs();
    
    expect(component.kpis.totalCampaigns).toBe(2);
    expect(component.kpis.activeCampaigns).toBe(1);
    expect(component.kpis.totalVaccinated).toBe(230);
    expect(component.kpis.targetPopulation).toBe(300);
  });

  it('should return correct coverage color', () => {
    expect(component.getCoverageColor(90)).toBe('#38ef7d');
    expect(component.getCoverageColor(70)).toBe('#f093fb');
    expect(component.getCoverageColor(50)).toBe('#ffa726');
    expect(component.getCoverageColor(30)).toBe('#ef5350');
  });

  it('should export analytics to CSV', () => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:test');
    spyOn(window.URL, 'revokeObjectURL');
    
    component.exportAnalytics();
    
    setTimeout(() => {
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    }, 1100);
  });
});
