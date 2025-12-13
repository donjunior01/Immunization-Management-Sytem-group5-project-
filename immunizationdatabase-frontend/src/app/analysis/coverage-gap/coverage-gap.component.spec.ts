import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoverageGapComponent } from './coverage-gap.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('CoverageGapComponent', () => {
  let component: CoverageGapComponent;
  let fixture: ComponentFixture<CoverageGapComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'info', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [
        CoverageGapComponent,
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

    fixture = TestBed.createComponent(CoverageGapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccineName')).toBeTruthy();
      expect(component.filterForm.get('ageGroup')).toBeTruthy();
      expect(component.filterForm.get('districtId')).toBeTruthy();
      expect(component.filterForm.get('facilityId')).toBeTruthy();
      expect(component.filterForm.get('priority')).toBeTruthy();
      expect(component.filterForm.get('interventionStatus')).toBeTruthy();
      expect(component.filterForm.get('coverageRateMin')).toBeTruthy();
      expect(component.filterForm.get('coverageRateMax')).toBeTruthy();
    });

    it('should initialize intervention form with correct controls', () => {
      expect(component.interventionForm.get('interventionType')).toBeTruthy();
      expect(component.interventionForm.get('startDate')).toBeTruthy();
      expect(component.interventionForm.get('endDate')).toBeTruthy();
      expect(component.interventionForm.get('budget')).toBeTruthy();
      expect(component.interventionForm.get('expectedCoverage')).toBeTruthy();
      expect(component.interventionForm.get('notes')).toBeTruthy();
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate 50 coverage gaps', () => {
      expect(component.coverageGaps.length).toBe(50);
    });

    it('should generate gaps with correct structure', () => {
      const gap = component.coverageGaps[0];
      expect(gap.id).toBeDefined();
      expect(gap.facilityId).toBeDefined();
      expect(gap.facilityName).toBeDefined();
      expect(gap.districtId).toBeDefined();
      expect(gap.districtName).toBeDefined();
      expect(gap.vaccineName).toBeDefined();
      expect(gap.ageGroup).toBeDefined();
      expect(gap.targetPopulation).toBeDefined();
      expect(gap.vaccinated).toBeDefined();
      expect(gap.unvaccinated).toBeDefined();
      expect(gap.coverageRate).toBeDefined();
      expect(gap.gapPercentage).toBeDefined();
      expect(gap.priority).toBeDefined();
      expect(gap.interventionStatus).toBeDefined();
      expect(gap.recommendations).toBeDefined();
    });

    it('should calculate unvaccinated correctly', () => {
      component.coverageGaps.forEach(gap => {
        expect(gap.unvaccinated).toBe(gap.targetPopulation - gap.vaccinated);
      });
    });

    it('should assign priority based on coverage rate', () => {
      component.coverageGaps.forEach(gap => {
        if (gap.coverageRate < 50) {
          expect(gap.priority).toBe('Critical');
        } else if (gap.coverageRate < 70) {
          expect(gap.priority).toBe('High');
        } else if (gap.coverageRate < 85) {
          expect(gap.priority).toBe('Medium');
        } else {
          expect(gap.priority).toBe('Low');
        }
      });
    });

    it('should sort gaps by priority', () => {
      const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      for (let i = 0; i < component.coverageGaps.length - 1; i++) {
        const currentPriority = priorityOrder[component.coverageGaps[i].priority];
        const nextPriority = priorityOrder[component.coverageGaps[i + 1].priority];
        expect(currentPriority).toBeLessThanOrEqual(nextPriority);
      }
    });

    it('should generate recommendations based on coverage', () => {
      component.coverageGaps.forEach(gap => {
        if (gap.coverageRate < 70) {
          expect(gap.recommendations.some(r => r.includes('outreach campaign'))).toBeTruthy();
        }
        if (gap.gapPercentage > 30) {
          expect(gap.recommendations.some(r => r.includes('mobile vaccination'))).toBeTruthy();
        }
      });
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate total facilities correctly', () => {
      const uniqueFacilities = new Set(component.coverageGaps.map(g => g.facilityId)).size;
      expect(component.coverageStats.totalFacilities).toBe(uniqueFacilities);
    });

    it('should calculate facilities with gaps correctly', () => {
      const facilitiesWithGaps = new Set(
        component.coverageGaps.filter(g => g.gapPercentage > 15).map(g => g.facilityId)
      ).size;
      expect(component.coverageStats.facilitiesWithGaps).toBe(facilitiesWithGaps);
    });

    it('should calculate average coverage rate correctly', () => {
      const totalCoverage = component.coverageGaps.reduce((sum, g) => sum + g.coverageRate, 0);
      const averageCoverage = totalCoverage / component.coverageGaps.length;
      expect(component.coverageStats.averageCoverageRate).toBeCloseTo(averageCoverage, 1);
    });

    it('should calculate priority gap counts correctly', () => {
      const criticalCount = component.coverageGaps.filter(g => g.priority === 'Critical').length;
      const highCount = component.coverageGaps.filter(g => g.priority === 'High').length;
      const mediumCount = component.coverageGaps.filter(g => g.priority === 'Medium').length;
      const lowCount = component.coverageGaps.filter(g => g.priority === 'Low').length;

      expect(component.coverageStats.criticalGaps).toBe(criticalCount);
      expect(component.coverageStats.highPriorityGaps).toBe(highCount);
      expect(component.coverageStats.mediumPriorityGaps).toBe(mediumCount);
      expect(component.coverageStats.lowPriorityGaps).toBe(lowCount);
    });

    it('should calculate total populations correctly', () => {
      const totalTarget = component.coverageGaps.reduce((sum, g) => sum + g.targetPopulation, 0);
      const totalVaccinated = component.coverageGaps.reduce((sum, g) => sum + g.vaccinated, 0);
      const totalUnvaccinated = component.coverageGaps.reduce((sum, g) => sum + g.unvaccinated, 0);

      expect(component.coverageStats.totalTargetPopulation).toBe(totalTarget);
      expect(component.coverageStats.totalVaccinated).toBe(totalVaccinated);
      expect(component.coverageStats.totalUnvaccinated).toBe(totalUnvaccinated);
    });

    it('should handle empty data gracefully', () => {
      component.coverageGaps = [];
      component.calculateStats();
      expect(component.coverageStats.averageCoverageRate).toBe(0);
    });
  });

  describe('Geographic Coverage Analysis', () => {
    it('should generate geographic coverage for all districts', () => {
      const uniqueDistricts = new Set(component.coverageGaps.map(g => g.districtId)).size;
      expect(component.geographicCoverage.length).toBe(uniqueDistricts);
    });

    it('should calculate district coverage rates correctly', () => {
      component.geographicCoverage.forEach(district => {
        const districtGaps = component.coverageGaps.filter(g => g.districtId === district.districtId);
        const totalTarget = districtGaps.reduce((sum, g) => sum + g.targetPopulation, 0);
        const totalVaccinated = districtGaps.reduce((sum, g) => sum + g.vaccinated, 0);
        const expectedCoverage = totalTarget > 0 ? (totalVaccinated / totalTarget) * 100 : 0;
        expect(district.coverageRate).toBeCloseTo(expectedCoverage, 1);
      });
    });

    it('should assign district priority based on coverage and critical gaps', () => {
      component.geographicCoverage.forEach(district => {
        if (district.coverageRate < 50 || district.criticalGaps > 5) {
          expect(district.priority).toBe('Critical');
        } else if (district.coverageRate < 70 || district.criticalGaps > 2) {
          expect(district.priority).toBe('High');
        } else if (district.coverageRate < 85) {
          expect(district.priority).toBe('Medium');
        } else {
          expect(district.priority).toBe('Low');
        }
      });
    });

    it('should sort districts by coverage rate ascending', () => {
      for (let i = 0; i < component.geographicCoverage.length - 1; i++) {
        expect(component.geographicCoverage[i].coverageRate)
          .toBeLessThanOrEqual(component.geographicCoverage[i + 1].coverageRate);
      }
    });
  });

  describe('Vaccine Coverage Analysis', () => {
    it('should generate vaccine coverage for all vaccines', () => {
      const uniqueVaccines = new Set(component.coverageGaps.map(g => g.vaccineName)).size;
      expect(component.vaccineCoverage.length).toBe(uniqueVaccines);
    });

    it('should calculate vaccine coverage rates correctly', () => {
      component.vaccineCoverage.forEach(vaccine => {
        const vaccineGaps = component.coverageGaps.filter(g => g.vaccineName === vaccine.vaccineName);
        const totalTarget = vaccineGaps.reduce((sum, g) => sum + g.targetPopulation, 0);
        const totalVaccinated = vaccineGaps.reduce((sum, g) => sum + g.vaccinated, 0);
        const expectedCoverage = totalTarget > 0 ? (totalVaccinated / totalTarget) * 100 : 0;
        expect(vaccine.coverageRate).toBeCloseTo(expectedCoverage, 1);
      });
    });

    it('should calculate gap percentage as complement of coverage', () => {
      component.vaccineCoverage.forEach(vaccine => {
        const expectedGap = 100 - vaccine.coverageRate;
        expect(vaccine.gapPercentage).toBeCloseTo(expectedGap, 1);
      });
    });

    it('should count facilities affected correctly', () => {
      component.vaccineCoverage.forEach(vaccine => {
        const facilitiesAffected = new Set(
          component.coverageGaps.filter(g => g.vaccineName === vaccine.vaccineName).map(g => g.facilityId)
        ).size;
        expect(vaccine.facilitiesAffected).toBe(facilitiesAffected);
      });
    });

    it('should generate recommendations based on coverage', () => {
      component.vaccineCoverage.forEach(vaccine => {
        if (vaccine.coverageRate < 70) {
          expect(vaccine.recommendations.some(r => r.includes('catch-up campaign'))).toBeTruthy();
        }
        if (vaccine.gapPercentage > 30) {
          expect(vaccine.recommendations.some(r => r.includes('mass vaccination'))).toBeTruthy();
        }
      });
    });

    it('should sort vaccines by coverage rate ascending', () => {
      for (let i = 0; i < component.vaccineCoverage.length - 1; i++) {
        expect(component.vaccineCoverage[i].coverageRate)
          .toBeLessThanOrEqual(component.vaccineCoverage[i + 1].coverageRate);
      }
    });
  });

  describe('Intervention Plans Generation', () => {
    it('should generate intervention plans for critical and high priority gaps', () => {
      expect(component.interventionPlans.length).toBeGreaterThan(0);
      expect(component.interventionPlans.length).toBeLessThanOrEqual(10);
    });

    it('should generate plans with correct structure', () => {
      const plan = component.interventionPlans[0];
      expect(plan.id).toBeDefined();
      expect(plan.gapId).toBeDefined();
      expect(plan.facilityName).toBeDefined();
      expect(plan.vaccineName).toBeDefined();
      expect(plan.ageGroup).toBeDefined();
      expect(plan.targetPopulation).toBeDefined();
      expect(plan.interventionType).toBeDefined();
      expect(plan.startDate).toBeDefined();
      expect(plan.endDate).toBeDefined();
      expect(plan.budget).toBeDefined();
      expect(plan.status).toBeDefined();
      expect(plan.expectedCoverage).toBeDefined();
    });

    it('should set actual coverage only for completed interventions', () => {
      component.interventionPlans.forEach(plan => {
        if (plan.status === 'Completed') {
          expect(plan.actualCoverage).not.toBeNull();
        } else {
          expect(plan.actualCoverage).toBeNull();
        }
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by search term', () => {
      component.filterForm.patchValue({ search: 'FAC001' });
      expect(component.filteredGaps.every(g => 
        g.facilityName.includes('FAC001') || 
        g.districtName.includes('FAC001') ||
        g.vaccineName.includes('FAC001') ||
        g.ageGroup.includes('FAC001')
      )).toBeTruthy();
    });

    it('should filter by vaccine name', () => {
      const vaccineName = component.vaccines[0];
      component.filterForm.patchValue({ vaccineName });
      expect(component.filteredGaps.every(g => g.vaccineName === vaccineName)).toBeTruthy();
    });

    it('should filter by age group', () => {
      const ageGroup = component.ageGroups[0];
      component.filterForm.patchValue({ ageGroup });
      expect(component.filteredGaps.every(g => g.ageGroup === ageGroup)).toBeTruthy();
    });

    it('should filter by district', () => {
      const districtId = component.districts[0];
      component.filterForm.patchValue({ districtId });
      expect(component.filteredGaps.every(g => g.districtId === districtId)).toBeTruthy();
    });

    it('should filter by facility', () => {
      const facilityId = component.facilities[0];
      component.filterForm.patchValue({ facilityId });
      expect(component.filteredGaps.every(g => g.facilityId === facilityId)).toBeTruthy();
    });

    it('should filter by priority', () => {
      component.filterForm.patchValue({ priority: 'Critical' });
      expect(component.filteredGaps.every(g => g.priority === 'Critical')).toBeTruthy();
    });

    it('should filter by intervention status', () => {
      component.filterForm.patchValue({ interventionStatus: 'Planned' });
      expect(component.filteredGaps.every(g => g.interventionStatus === 'Planned')).toBeTruthy();
    });

    it('should filter by minimum coverage rate', () => {
      component.filterForm.patchValue({ coverageRateMin: 70 });
      expect(component.filteredGaps.every(g => g.coverageRate >= 70)).toBeTruthy();
    });

    it('should filter by maximum coverage rate', () => {
      component.filterForm.patchValue({ coverageRateMax: 70 });
      expect(component.filteredGaps.every(g => g.coverageRate <= 70)).toBeTruthy();
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({
        search: 'test',
        vaccineName: 'BCG',
        priority: 'Critical'
      });
      component.resetFilters();
      expect(component.filterForm.value.search).toBeFalsy();
      expect(component.filterForm.value.vaccineName).toBeFalsy();
      expect(component.filterForm.value.priority).toBeFalsy();
    });

    it('should reset page index when filters change', () => {
      component.pageIndex = 5;
      component.applyFilters();
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should return correct page of gaps', () => {
      component.pageIndex = 0;
      component.pageSize = 10;
      const paginated = component.getPaginatedGaps();
      expect(paginated.length).toBeLessThanOrEqual(10);
    });

    it('should handle page change', () => {
      const event = { pageIndex: 2, pageSize: 25, length: 50 };
      component.onPageChange(event);
      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(25);
    });
  });

  describe('Detail Dialog', () => {
    it('should open detail dialog', () => {
      const gap = component.coverageGaps[0];
      component.viewGapDetails(gap);
      expect(component.showDetailDialog).toBeTruthy();
      expect(component.selectedGap).toBe(gap);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.selectedGap = component.coverageGaps[0];
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBeFalsy();
      expect(component.selectedGap).toBeNull();
    });
  });

  describe('Intervention Dialog', () => {
    it('should open intervention dialog', () => {
      const gap = component.coverageGaps[0];
      component.planIntervention(gap);
      expect(component.showInterventionDialog).toBeTruthy();
      expect(component.selectedGap).toBe(gap);
    });

    it('should close intervention dialog', () => {
      component.showInterventionDialog = true;
      component.selectedGap = component.coverageGaps[0];
      component.closeInterventionDialog();
      expect(component.showInterventionDialog).toBeFalsy();
      expect(component.selectedGap).toBeNull();
    });

    it('should submit intervention when form is valid', () => {
      component.selectedGap = component.coverageGaps[0];
      component.interventionForm.patchValue({
        interventionType: 'Outreach Campaign',
        startDate: new Date(),
        endDate: new Date(),
        budget: 10000,
        expectedCoverage: 80,
        notes: 'Test notes'
      });
      component.submitIntervention();
      expect(loaderService.show).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should export gaps as CSV', () => {
      component.exportGaps('csv');
      expect(loaderService.show).toHaveBeenCalled();
    });

    it('should export gaps as JSON', () => {
      component.exportGaps('json');
      expect(loaderService.show).toHaveBeenCalled();
    });

    it('should export gaps as PDF', () => {
      component.exportGaps('pdf');
      expect(loaderService.show).toHaveBeenCalled();
    });
  });

  describe('Report Generation', () => {
    it('should generate coverage report', () => {
      component.generateCoverageReport();
      expect(loaderService.show).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should return correct priority color', () => {
      expect(component.getPriorityColor('Critical')).toBe('warn');
      expect(component.getPriorityColor('High')).toBe('warn');
      expect(component.getPriorityColor('Medium')).toBe('accent');
      expect(component.getPriorityColor('Low')).toBe('primary');
    });

    it('should return correct intervention status color', () => {
      expect(component.getInterventionStatusColor('Completed')).toBe('primary');
      expect(component.getInterventionStatusColor('Ongoing')).toBe('accent');
      expect(component.getInterventionStatusColor('Planned')).toBe('accent');
      expect(component.getInterventionStatusColor('Not Started')).toBe('warn');
    });

    it('should return correct trend color', () => {
      expect(component.getTrendColor('Improving')).toBe('primary');
      expect(component.getTrendColor('Stable')).toBe('accent');
      expect(component.getTrendColor('Declining')).toBe('warn');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(component.formatDate(date)).toBeTruthy();
    });

    it('should return "Never" for null date', () => {
      expect(component.formatDate(null)).toBe('Never');
    });

    it('should format number with locale string', () => {
      expect(component.formatNumber(1000)).toBe('1,000');
    });
  });

  describe('LocalStorage', () => {
    it('should save data to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.applyFilters();
      expect(localStorage.setItem).toHaveBeenCalledWith('coverageGapData', jasmine.any(String));
    });

    it('should load data from localStorage', () => {
      const mockData = {
        coverageGaps: component.coverageGaps,
        coverageStats: component.coverageStats,
        timestamp: new Date().toISOString()
      };
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockData));
      component.ngOnInit();
      expect(component.coverageGaps.length).toBeGreaterThan(0);
    });
  });
});
