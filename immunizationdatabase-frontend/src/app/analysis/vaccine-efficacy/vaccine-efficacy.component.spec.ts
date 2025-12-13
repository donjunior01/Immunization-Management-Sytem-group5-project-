import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VaccineEfficacyComponent } from './vaccine-efficacy.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('VaccineEfficacyComponent', () => {
  let component: VaccineEfficacyComponent;
  let fixture: ComponentFixture<VaccineEfficacyComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info', 'confirm']);

    await TestBed.configureTestingModule({
      imports: [VaccineEfficacyComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(VaccineEfficacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Form Initialization Tests
  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccine')).toBeTruthy();
      expect(component.filterForm.get('manufacturer')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('dateRange')).toBeTruthy();
      expect(component.filterForm.get('efficacyMin')).toBeTruthy();
      expect(component.filterForm.get('efficacyMax')).toBeTruthy();
    });

    it('should initialize filter form with default values', () => {
      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.vaccine).toBe('');
      expect(component.filterForm.value.manufacturer).toBe('');
      expect(component.filterForm.value.status).toBe('');
      expect(component.filterForm.value.efficacyMin).toBe(0);
      expect(component.filterForm.value.efficacyMax).toBe(100);
    });

    it('should initialize record form with correct controls and validators', () => {
      const form = component.recordForm;
      expect(form.get('vaccineName')?.hasError('required')).toBe(true);
      expect(form.get('manufacturer')?.hasError('required')).toBe(true);
      expect(form.get('batchNumber')?.hasError('required')).toBe(true);
      expect(form.get('startDate')?.hasError('required')).toBe(true);
      expect(form.get('endDate')?.hasError('required')).toBe(true);
      expect(form.get('populationSize')?.hasError('required')).toBe(true);
      expect(form.get('ageGroup')?.hasError('required')).toBe(true);
      expect(form.get('gender')?.hasError('required')).toBe(true);
      expect(form.get('efficacyRate')?.hasError('required')).toBe(true);
      expect(form.get('effectivenessRate')?.hasError('required')).toBe(true);
    });
  });

  // Mock Data Generation Tests
  describe('Mock Data Generation', () => {
    it('should generate 50 efficacy records (10 vaccines × 5 facilities)', () => {
      const records = component.generateMockEfficacyRecords();
      expect(records.length).toBe(50);
    });

    it('should generate records with all required fields', () => {
      const records = component.generateMockEfficacyRecords();
      const record = records[0];
      
      expect(record.id).toBeTruthy();
      expect(record.vaccineName).toBeTruthy();
      expect(record.manufacturer).toBeTruthy();
      expect(record.batchNumber).toBeTruthy();
      expect(record.studyPeriod.startDate).toBeInstanceOf(Date);
      expect(record.studyPeriod.endDate).toBeInstanceOf(Date);
      expect(record.populationSize).toBeGreaterThan(0);
      expect(record.demographics.ageGroup).toBeTruthy();
      expect(record.demographics.gender).toBeTruthy();
      expect(record.efficacyRate).toBeGreaterThanOrEqual(65);
      expect(record.efficacyRate).toBeLessThanOrEqual(95);
      expect(record.adverseEvents.total).toBeGreaterThanOrEqual(0);
      expect(record.immuneResponse.antibodyLevel).toBeGreaterThan(0);
    });

    it('should generate records with correct adverse events calculation', () => {
      const records = component.generateMockEfficacyRecords();
      const record = records[0];
      
      const calculatedTotal = record.adverseEvents.mild + 
                             record.adverseEvents.moderate + 
                             record.adverseEvents.severe;
      expect(record.adverseEvents.total).toBe(calculatedTotal);
    });

    it('should generate records with effectiveness rate less than efficacy rate', () => {
      const records = component.generateMockEfficacyRecords();
      records.forEach(record => {
        expect(record.effectivenessRate).toBeLessThan(record.efficacyRate);
      });
    });
  });

  // Statistics Calculation Tests
  describe('Statistics Calculation', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.calculateStats();
    });

    it('should calculate total studies correctly', () => {
      expect(component.stats.totalStudies).toBe(component.efficacyRecords.length);
    });

    it('should calculate active studies correctly', () => {
      const activeCount = component.efficacyRecords.filter(r => r.status === 'Active').length;
      expect(component.stats.activeStudies).toBe(activeCount);
    });

    it('should calculate average efficacy correctly', () => {
      const avgEfficacy = component.efficacyRecords.reduce((sum, r) => sum + r.efficacyRate, 0) / 
                         component.efficacyRecords.length;
      expect(component.stats.averageEfficacy).toBeCloseTo(avgEfficacy, 2);
    });

    it('should calculate average effectiveness correctly', () => {
      const avgEffectiveness = component.efficacyRecords.reduce((sum, r) => sum + r.effectivenessRate, 0) / 
                              component.efficacyRecords.length;
      expect(component.stats.averageEffectiveness).toBeCloseTo(avgEffectiveness, 2);
    });

    it('should calculate total participants correctly', () => {
      const totalPop = component.efficacyRecords.reduce((sum, r) => sum + r.populationSize, 0);
      expect(component.stats.totalParticipants).toBe(totalPop);
    });

    it('should calculate total adverse events correctly', () => {
      const totalAdverse = component.efficacyRecords.reduce((sum, r) => sum + r.adverseEvents.total, 0);
      expect(component.stats.totalAdverseEvents).toBe(totalAdverse);
    });

    it('should categorize efficacy rates correctly', () => {
      const highCount = component.efficacyRecords.filter(r => r.efficacyRate >= 90).length;
      const moderateCount = component.efficacyRecords.filter(r => r.efficacyRate >= 70 && r.efficacyRate < 90).length;
      const lowCount = component.efficacyRecords.filter(r => r.efficacyRate < 70).length;

      expect(component.stats.highEfficacyCount).toBe(highCount);
      expect(component.stats.moderateEfficacyCount).toBe(moderateCount);
      expect(component.stats.lowEfficacyCount).toBe(lowCount);
    });
  });

  // Comparative Analysis Tests
  describe('Comparative Analysis', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.generateComparativeAnalysis();
    });

    it('should generate comparative data for all vaccines', () => {
      expect(component.comparativeData.length).toBe(component.vaccines.length);
    });

    it('should calculate average efficacy per vaccine correctly', () => {
      const firstVaccine = component.comparativeData[0];
      const vaccineRecords = component.efficacyRecords.filter(r => r.vaccineName === firstVaccine.vaccineName);
      const avgEfficacy = vaccineRecords.reduce((sum, r) => sum + r.efficacyRate, 0) / vaccineRecords.length;
      
      expect(firstVaccine.efficacy).toBeCloseTo(avgEfficacy, 2);
    });

    it('should sort vaccines by overall score in descending order', () => {
      for (let i = 0; i < component.comparativeData.length - 1; i++) {
        expect(component.comparativeData[i].overallScore).toBeGreaterThanOrEqual(
          component.comparativeData[i + 1].overallScore
        );
      }
    });

    it('should calculate overall score within 0-100 range', () => {
      component.comparativeData.forEach(vaccine => {
        expect(vaccine.overallScore).toBeGreaterThanOrEqual(0);
        expect(vaccine.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate adverse event rate correctly', () => {
      const vaccine = component.comparativeData[0];
      const records = component.efficacyRecords.filter(r => r.vaccineName === vaccine.vaccineName);
      const totalPop = records.reduce((sum, r) => sum + r.populationSize, 0);
      const totalAdverse = records.reduce((sum, r) => sum + r.adverseEvents.total, 0);
      const rate = (totalAdverse / totalPop) * 100;

      expect(vaccine.adverseEventRate).toBeCloseTo(rate, 2);
    });
  });

  // Trend Analysis Tests
  describe('Trend Analysis', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.generateTrendAnalysis();
    });

    it('should generate trend data with monthly aggregations', () => {
      expect(component.trendData.length).toBeGreaterThan(0);
    });

    it('should limit trend data to last 12 months', () => {
      expect(component.trendData.length).toBeLessThanOrEqual(12);
    });

    it('should sort trend data chronologically', () => {
      for (let i = 0; i < component.trendData.length - 1; i++) {
        expect(component.trendData[i].month.localeCompare(component.trendData[i + 1].month)).toBeLessThanOrEqual(0);
      }
    });

    it('should aggregate efficacy values correctly', () => {
      component.trendData.forEach(trend => {
        expect(trend.efficacy).toBeGreaterThan(0);
        expect(trend.efficacy).toBeLessThanOrEqual(100);
      });
    });
  });

  // Filtering Tests
  describe('Filtering', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
    });

    it('should filter by search term', () => {
      const firstRecord = component.efficacyRecords[0];
      component.filterForm.patchValue({ search: firstRecord.vaccineName });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        expect(record.vaccineName.toLowerCase()).toContain(firstRecord.vaccineName.toLowerCase());
      });
    });

    it('should filter by vaccine name', () => {
      const vaccine = component.vaccines[0];
      component.filterForm.patchValue({ vaccine });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        expect(record.vaccineName).toBe(vaccine);
      });
    });

    it('should filter by manufacturer', () => {
      const manufacturer = component.manufacturers[0];
      component.filterForm.patchValue({ manufacturer });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        expect(record.manufacturer).toBe(manufacturer);
      });
    });

    it('should filter by status', () => {
      const status = 'Active';
      component.filterForm.patchValue({ status });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        expect(record.status).toBe(status);
      });
    });

    it('should filter by efficacy range', () => {
      component.filterForm.patchValue({ efficacyMin: 80, efficacyMax: 90 });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        expect(record.efficacyRate).toBeGreaterThanOrEqual(80);
        expect(record.efficacyRate).toBeLessThanOrEqual(90);
      });
    });

    it('should filter by date range', () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2024, 5, 30);
      component.filterForm.patchValue({
        dateRange: { start: startDate, end: endDate }
      });
      component.applyFilters();

      component.filteredRecords.forEach(record => {
        const recordStart = record.studyPeriod.startDate.getTime();
        const recordEnd = record.studyPeriod.endDate.getTime();
        const filterStart = startDate.getTime();
        const filterEnd = endDate.getTime();

        expect(recordEnd >= filterStart || recordStart <= filterEnd).toBe(true);
      });
    });
  });

  // Reset Filters Test
  describe('Reset Filters', () => {
    it('should reset all filter values', () => {
      component.filterForm.patchValue({
        search: 'test',
        vaccine: 'Pfizer-BioNTech',
        manufacturer: 'Pfizer',
        status: 'Active',
        efficacyMin: 80,
        efficacyMax: 90
      });

      component.resetFilters();

      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.vaccine).toBe('');
      expect(component.filterForm.value.manufacturer).toBe('');
      expect(component.filterForm.value.status).toBe('');
      expect(component.filterForm.value.efficacyMin).toBe(0);
      expect(component.filterForm.value.efficacyMax).toBe(100);
    });
  });

  // Pagination Tests
  describe('Pagination', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.applyFilters();
    });

    it('should update displayed records on page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 50 });
      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(10);
      expect(component.displayedRecords.length).toBeLessThanOrEqual(10);
    });

    it('should display correct records for current page', () => {
      component.pageIndex = 0;
      component.pageSize = 10;
      component.updateDisplayedRecords();
      
      expect(component.displayedRecords.length).toBeLessThanOrEqual(10);
      expect(component.displayedRecords[0]).toBe(component.filteredRecords[0]);
    });
  });

  // CRUD Operations Tests
  describe('CRUD Operations', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
    });

    it('should open record dialog in create mode', () => {
      component.openRecordDialog();
      expect(component.showRecordDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
      expect(component.selectedRecord).toBeNull();
    });

    it('should open record dialog in edit mode and patch form', () => {
      const record = component.efficacyRecords[0];
      component.openRecordDialog(record);

      expect(component.showRecordDialog).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedRecord).toBe(record);
      expect(component.recordForm.value.vaccineName).toBe(record.vaccineName);
      expect(component.recordForm.value.manufacturer).toBe(record.manufacturer);
    });

    it('should close record dialog and reset form', () => {
      component.showRecordDialog = true;
      component.isEditMode = true;
      component.selectedRecord = component.efficacyRecords[0];

      component.closeRecordDialog();

      expect(component.showRecordDialog).toBe(false);
      expect(component.isEditMode).toBe(false);
      expect(component.selectedRecord).toBeNull();
    });

    it('should create new record on save in create mode', () => {
      component.recordForm.patchValue({
        vaccineName: 'Test Vaccine',
        manufacturer: 'Test Manufacturer',
        batchNumber: 'TEST-001',
        startDate: new Date(),
        endDate: new Date(),
        populationSize: 1000,
        ageGroup: '18-49 years',
        gender: 'All',
        comorbidities: ['None'],
        efficacyRate: 85,
        effectivenessRate: 80,
        mildEvents: 50,
        moderateEvents: 10,
        severeEvents: 1,
        antibodyLevel: 500,
        tcellResponse: 75,
        immuneDuration: 180,
        breakthroughCases: 5,
        breakthroughSeverity: 'Mild',
        confidenceLevel: 95,
        confidenceInterval: '80% - 90%',
        status: 'Active',
        facilityName: 'Test Facility',
        notes: 'Test notes'
      });

      const initialLength = component.efficacyRecords.length;
      component.saveRecord();

      expect(component.efficacyRecords.length).toBe(initialLength + 1);
      expect(notificationService.success).toHaveBeenCalledWith('Efficacy record created successfully!');
    });

    it('should update existing record on save in edit mode', () => {
      const record = component.efficacyRecords[0];
      component.isEditMode = true;
      component.selectedRecord = record;

      component.recordForm.patchValue({
        vaccineName: 'Updated Vaccine',
        manufacturer: record.manufacturer,
        batchNumber: record.batchNumber,
        startDate: record.studyPeriod.startDate,
        endDate: record.studyPeriod.endDate,
        populationSize: record.populationSize,
        ageGroup: record.demographics.ageGroup,
        gender: record.demographics.gender,
        comorbidities: record.demographics.comorbidities,
        efficacyRate: 90,
        effectivenessRate: 85,
        mildEvents: record.adverseEvents.mild,
        moderateEvents: record.adverseEvents.moderate,
        severeEvents: record.adverseEvents.severe,
        antibodyLevel: record.immuneResponse.antibodyLevel,
        tcellResponse: record.immuneResponse.tcellResponse,
        immuneDuration: record.immuneResponse.duration,
        breakthroughCases: record.breakthrough.length,
        breakthroughSeverity: record.breakthrough[0]?.severity || 'Mild',
        confidenceLevel: record.confidence.level,
        confidenceInterval: record.confidence.interval,
        status: record.status,
        facilityName: record.facilityName,
        notes: record.notes
      });

      const initialLength = component.efficacyRecords.length;
      component.saveRecord();

      expect(component.efficacyRecords.length).toBe(initialLength);
      const updatedRecord = component.efficacyRecords.find(r => r.id === record.id);
      expect(updatedRecord?.vaccineName).toBe('Updated Vaccine');
      expect(notificationService.success).toHaveBeenCalledWith('Efficacy record updated successfully!');
    });

    it('should not save record if form is invalid', () => {
      component.recordForm.reset();
      const initialLength = component.efficacyRecords.length;

      component.saveRecord();

      expect(component.efficacyRecords.length).toBe(initialLength);
      expect(notificationService.error).toHaveBeenCalled();
    });

    it('should delete record', () => {
      const record = component.efficacyRecords[0];
      const initialLength = component.efficacyRecords.length;

      component.deleteRecord(record);

      expect(component.efficacyRecords.length).toBe(initialLength - 1);
      expect(component.efficacyRecords.find(r => r.id === record.id)).toBeUndefined();
      expect(notificationService.confirm).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  // Export Tests
  describe('Export Functionality', () => {
    beforeEach(() => {
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.applyFilters();
    });

    it('should export data as CSV', () => {
      component.exportData('csv');
      expect(loaderService.show).toHaveBeenCalled();
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Data exported as CSV successfully!');
      }, 1100);
    });

    it('should export data as JSON', () => {
      component.exportData('json');
      expect(loaderService.show).toHaveBeenCalled();
      setTimeout(() => {
        expect(notificationService.success).toHaveBeenCalledWith('Data exported as JSON successfully!');
      }, 1100);
    });

    it('should show info for PDF export', () => {
      component.exportData('pdf');
      expect(loaderService.show).toHaveBeenCalled();
      setTimeout(() => {
        expect(notificationService.info).toHaveBeenCalled();
      }, 1100);
    });
  });

  // Helper Methods Tests
  describe('Helper Methods', () => {
    it('should return correct efficacy color', () => {
      expect(component.getEfficacyColor(95)).toBe('#10b981');
      expect(component.getEfficacyColor(85)).toBe('#f59e0b');
      expect(component.getEfficacyColor(65)).toBe('#ef4444');
    });

    it('should return correct status color', () => {
      expect(component.getStatusColor('Active')).toBe('#10b981');
      expect(component.getStatusColor('Completed')).toBe('#3b82f6');
      expect(component.getStatusColor('Under Review')).toBe('#f59e0b');
      expect(component.getStatusColor('Pending')).toBe('#6b7280');
    });

    it('should return correct severity color', () => {
      expect(component.getSeverityColor('Mild')).toBe('#10b981');
      expect(component.getSeverityColor('Moderate')).toBe('#f59e0b');
      expect(component.getSeverityColor('Severe')).toBe('#ef4444');
    });

    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15);
      const formatted = component.formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    it('should format number correctly', () => {
      expect(component.formatNumber(1000)).toBe('1,000');
      expect(component.formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format percentage correctly', () => {
      expect(component.formatPercentage(85.5)).toBe('85.5%');
      expect(component.formatPercentage(90)).toBe('90.0%');
    });
  });

  // LocalStorage Tests
  describe('LocalStorage Operations', () => {
    it('should save records to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.efficacyRecords = component.generateMockEfficacyRecords();
      component.saveToLocalStorage();

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'vaccineEfficacyRecords',
        jasmine.any(String)
      );
    });

    it('should load records from localStorage', () => {
      const mockRecords = component.generateMockEfficacyRecords();
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockRecords));

      component.loadEfficacyRecords();

      expect(component.efficacyRecords.length).toBeGreaterThan(0);
    });

    it('should generate mock records if localStorage is empty', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(component, 'generateMockEfficacyRecords').and.callThrough();

      component.loadEfficacyRecords();

      expect(component.generateMockEfficacyRecords).toHaveBeenCalled();
      expect(component.efficacyRecords.length).toBe(50);
    });
  });
});
