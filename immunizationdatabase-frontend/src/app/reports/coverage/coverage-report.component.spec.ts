import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CoverageReportComponent } from './coverage-report.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

describe('CoverageReportComponent', () => {
  let component: CoverageReportComponent;
  let fixture: ComponentFixture<CoverageReportComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'info']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getUserRole']);

    await TestBed.configureTestingModule({
      imports: [CoverageReportComponent],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    })
    .compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(CoverageReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load coverage data on init', () => {
    spyOn(component, 'loadCoverageData');
    component.ngOnInit();
    expect(component.loadCoverageData).toHaveBeenCalled();
  });

  it('should load KPIs correctly', () => {
    component.loadKPIs();
    expect(component.kpis.totalCoverageRate).toBe(87.5);
    expect(component.kpis.fullyVaccinated).toBe(1245);
    expect(component.kpis.partiallyVaccinated).toBe(387);
    expect(component.kpis.unvaccinated).toBe(168);
    expect(component.kpis.dropoutRate).toBe(8.2);
    expect(component.kpis.onTimeRate).toBe(92.3);
  });

  it('should load vaccine coverage data with 6 vaccines', () => {
    component.loadVaccineCoverage();
    expect(component.vaccineCoverageData.length).toBe(6);
    expect(component.vaccineCoverageData[0].vaccineName).toBe('BCG');
    expect(component.vaccineCoverageData[5].vaccineName).toBe('Polio');
  });

  it('should load age group data with 5 groups', () => {
    component.loadAgeGroupData();
    expect(component.ageGroupData.length).toBe(5);
    expect(component.ageGroupData[0].ageGroup).toBe('0-2 months');
    expect(component.ageGroupData[4].ageGroup).toBe('24+ months');
  });

  it('should load 6 months of coverage trends', () => {
    component.loadCoverageTrends();
    expect(component.coverageTrends.length).toBe(6);
    expect(component.coverageTrends[0].month).toBe('Jul 2024');
    expect(component.coverageTrends[5].month).toBe('Dec 2024');
  });

  it('should load geographical data with 4 districts', () => {
    component.loadGeographicalData();
    expect(component.geographicalData.length).toBe(4);
    expect(component.geographicalData[0].district).toBe('District 001');
  });

  it('should load demographic data with 3 categories', () => {
    component.loadDemographicData();
    expect(component.demographicData.length).toBe(3);
    expect(component.demographicData[0].category).toBe('Fully Vaccinated');
  });

  it('should load defaulter data with 6 vaccines', () => {
    component.loadDefaulterData();
    expect(component.defaulterData.length).toBe(6);
    expect(component.defaulterData[0].priority).toBe('HIGH');
  });

  it('should apply filters and show success notification', (done) => {
    component.applyFilters();
    expect(loaderService.show).toHaveBeenCalledWith(800);
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Filters applied successfully');
      done();
    }, 850);
  });

  it('should reset filters and reapply', () => {
    component.startDate = new Date();
    component.endDate = new Date();
    component.selectedDistrict = 'DIST001';
    component.selectedVaccine = 'BCG';
    spyOn(component, 'applyFilters');
    component.resetFilters();
    expect(component.startDate).toBeNull();
    expect(component.endDate).toBeNull();
    expect(component.selectedDistrict).toBe('');
    expect(component.selectedVaccine).toBe('');
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should return correct vaccine status class', () => {
    expect(component.getVaccineStatusClass('EXCELLENT')).toBe('status-excellent');
    expect(component.getVaccineStatusClass('GOOD')).toBe('status-good');
    expect(component.getVaccineStatusClass('FAIR')).toBe('status-fair');
    expect(component.getVaccineStatusClass('POOR')).toBe('status-poor');
  });

  it('should return correct geographical status class', () => {
    expect(component.getGeoStatusClass('HIGH')).toBe('status-high');
    expect(component.getGeoStatusClass('MEDIUM')).toBe('status-medium');
    expect(component.getGeoStatusClass('LOW')).toBe('status-low');
  });

  it('should return correct priority class', () => {
    expect(component.getPriorityClass('HIGH')).toBe('priority-high');
    expect(component.getPriorityClass('MEDIUM')).toBe('priority-medium');
    expect(component.getPriorityClass('LOW')).toBe('priority-low');
  });

  it('should return correct coverage color based on rate', () => {
    expect(component.getCoverageColor(95)).toBe('#27ae60'); // >= 90
    expect(component.getCoverageColor(85)).toBe('#3498db'); // >= 80
    expect(component.getCoverageColor(75)).toBe('#f39c12'); // >= 70
    expect(component.getCoverageColor(65)).toBe('#e74c3c'); // < 70
  });

  it('should contact defaulters with notification', (done) => {
    component.contactDefaulters('DTP');
    expect(loaderService.show).toHaveBeenCalledWith(800);
    setTimeout(() => {
      expect(notificationService.success).toHaveBeenCalledWith('Defaulter contact initiated for DTP');
      done();
    }, 850);
  });

  it('should generate CSV report', () => {
    component.loadKPIs();
    component.loadVaccineCoverage();
    component.loadAgeGroupData();
    component.loadGeographicalData();
    component.loadDemographicData();
    component.loadDefaulterData();
    spyOn(document, 'createElement').and.returnValue(document.createElement('a'));
    component.generateCSV();
    expect(notificationService.success).toHaveBeenCalledWith('CSV report downloaded successfully');
  });

  it('should show info message for PDF generation', () => {
    component.generatePDF();
    expect(notificationService.info).toHaveBeenCalledWith('PDF generation would require additional library (e.g., jsPDF)');
  });

  it('should refresh report', () => {
    spyOn(component, 'loadCoverageData');
    component.refreshReport();
    expect(component.loadCoverageData).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Report refreshed successfully');
  });
});
