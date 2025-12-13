import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoseScheduleComponent } from './dose-schedule.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DoseScheduleComponent', () => {
  let component: DoseScheduleComponent;
  let fixture: ComponentFixture<DoseScheduleComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'info', 'confirm']);
    notificationSpy.confirm.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [
        DoseScheduleComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatMenuModule,
        MatTabsModule
      ],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture = TestBed.createComponent(DoseScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Form Initialization Tests
  it('should initialize filterForm with correct controls', () => {
    expect(component.filterForm.get('search')).toBeDefined();
    expect(component.filterForm.get('vaccine')).toBeDefined();
    expect(component.filterForm.get('priority')).toBeDefined();
    expect(component.filterForm.get('status')).toBeDefined();
    expect(component.filterForm.get('dateRange')).toBeDefined();
  });

  it('should initialize scheduleForm with validators', () => {
    const form = component.scheduleForm;
    expect(form.get('vaccineName')?.hasError('required')).toBeTrue();
    expect(form.get('batchNumber')?.hasError('required')).toBeTrue();
    expect(form.get('targetPopulation')?.hasError('required')).toBeTrue();
    expect(form.get('scheduledDoses')?.hasError('required')).toBeTrue();
  });

  it('should initialize scenarioForm with defaults', () => {
    expect(component.scenarioForm.get('personnelCount')?.value).toBe(5);
    expect(component.scenarioForm.get('vaccinationPoints')?.value).toBe(2);
    expect(component.scenarioForm.get('workingHoursPerDay')?.value).toBe(8);
    expect(component.scenarioForm.get('daysAvailable')?.value).toBe(30);
  });

  // Mock Data Generation Tests
  it('should generate 50 mock schedules', () => {
    expect(component.schedules.length).toBe(50);
    expect(component.filteredSchedules.length).toBe(50);
  });

  it('should generate schedules with correct structure', () => {
    const schedule = component.schedules[0];
    expect(schedule.id).toBeDefined();
    expect(schedule.vaccineName).toBeDefined();
    expect(schedule.batchNumber).toBeDefined();
    expect(schedule.targetPopulation).toBeGreaterThan(0);
    expect(schedule.scheduledDoses).toBeGreaterThan(0);
    expect(schedule.optimizationScore).toBeGreaterThanOrEqual(0);
    expect(schedule.optimizationScore).toBeLessThanOrEqual(100);
  });

  // Statistics Calculation Tests
  it('should calculate stats correctly', () => {
    const stats = component.stats;
    expect(stats.totalSchedules).toBe(50);
    expect(stats.totalDoses).toBeGreaterThan(0);
    expect(stats.allocatedDoses).toBeGreaterThan(0);
    expect(stats.remainingCapacity).toBeGreaterThan(0);
  });

  it('should calculate optimized schedules count', () => {
    const optimized = component.schedules.filter(s => s.optimizationScore >= 70);
    expect(component.stats.optimizedSchedules).toBe(optimized.length);
  });

  it('should calculate average score', () => {
    const sum = component.schedules.reduce((acc, s) => acc + s.optimizationScore, 0);
    const avg = sum / component.schedules.length;
    expect(component.stats.averageScore).toBeCloseTo(avg, 1);
  });

  // Resource Allocation Tests
  it('should calculate daily capacity correctly', () => {
    const schedule = component.schedules[0];
    const expectedCapacity = schedule.resourceAllocation.personnel * 
                           schedule.resourceAllocation.vaccinationPoints * 
                           schedule.resourceAllocation.workingHours * 10;
    expect(schedule.resourceAllocation.dailyCapacity).toBe(expectedCapacity);
  });

  it('should calculate days required correctly', () => {
    const schedule = component.schedules[0];
    const expectedDays = Math.ceil(schedule.scheduledDoses / schedule.resourceAllocation.dailyCapacity);
    expect(schedule.resourceAllocation.daysRequired).toBe(expectedDays);
  });

  // Filtering Tests
  it('should filter by search term', () => {
    component.filterForm.get('search')?.setValue('BCG');
    component.applyFilters();
    expect(component.filteredSchedules.every(s => 
      s.vaccineName.includes('BCG') || 
      s.facilityName.includes('BCG') || 
      s.batchNumber.includes('BCG')
    )).toBeTrue();
  });

  it('should filter by vaccine', () => {
    component.filterForm.get('vaccine')?.setValue('BCG');
    component.applyFilters();
    expect(component.filteredSchedules.every(s => s.vaccineName === 'BCG')).toBeTrue();
  });

  it('should filter by priority', () => {
    component.filterForm.get('priority')?.setValue('High');
    component.applyFilters();
    expect(component.filteredSchedules.every(s => s.priority === 'High')).toBeTrue();
  });

  it('should filter by status', () => {
    component.filterForm.get('status')?.setValue('Completed');
    component.applyFilters();
    expect(component.filteredSchedules.every(s => s.status === 'Completed')).toBeTrue();
  });

  it('should reset filters to defaults', () => {
    component.filterForm.get('search')?.setValue('test');
    component.filterForm.get('vaccine')?.setValue('BCG');
    component.resetFilters();
    expect(component.filterForm.get('search')?.value).toBe('');
    expect(component.filterForm.get('vaccine')?.value).toBe('All');
  });

  // Pagination Tests
  it('should paginate data correctly', () => {
    component.pageSize = 10;
    component.pageIndex = 0;
    const paginated = component.getPaginatedData();
    expect(paginated.length).toBe(10);
  });

  it('should handle page change', () => {
    const event = { pageIndex: 1, pageSize: 25, length: 50 };
    component.onPageChange(event);
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(25);
  });

  // CRUD Operations Tests
  it('should open schedule dialog in create mode', () => {
    component.openScheduleDialog();
    expect(component.showScheduleDialog).toBeTrue();
    expect(component.selectedSchedule).toBeNull();
    expect(component.scheduleForm.get('priority')?.value).toBe('Medium');
  });

  it('should open schedule dialog in edit mode', () => {
    const schedule = component.schedules[0];
    component.openScheduleDialog(schedule);
    expect(component.showScheduleDialog).toBeTrue();
    expect(component.selectedSchedule).toBe(schedule);
    expect(component.scheduleForm.get('vaccineName')?.value).toBe(schedule.vaccineName);
  });

  it('should close schedule dialog', () => {
    component.showScheduleDialog = true;
    component.selectedSchedule = component.schedules[0];
    component.closeScheduleDialog();
    expect(component.showScheduleDialog).toBeFalse();
    expect(component.selectedSchedule).toBeNull();
  });

  it('should save new schedule', () => {
    const initialLength = component.schedules.length;
    component.scheduleForm.patchValue({
      vaccineName: 'BCG',
      batchNumber: 'TEST001',
      targetPopulation: 1000,
      scheduledDoses: 900,
      startDate: new Date(),
      endDate: new Date(),
      priority: 'High',
      facilityId: 'FAC001',
      ageGroup: '0-1 months',
      personnel: 5,
      vaccinationPoints: 2,
      workingHours: 8
    });
    component.saveSchedule();
    expect(component.schedules.length).toBe(initialLength + 1);
    expect(notificationService.success).toHaveBeenCalledWith('Schedule created successfully');
  });

  it('should update existing schedule', () => {
    const schedule = component.schedules[0];
    component.selectedSchedule = schedule;
    component.scheduleForm.patchValue({
      vaccineName: 'Updated Vaccine',
      batchNumber: schedule.batchNumber,
      targetPopulation: schedule.targetPopulation,
      scheduledDoses: schedule.scheduledDoses,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      priority: schedule.priority,
      facilityId: schedule.facilityId,
      ageGroup: schedule.ageGroup,
      personnel: schedule.resourceAllocation.personnel,
      vaccinationPoints: schedule.resourceAllocation.vaccinationPoints,
      workingHours: schedule.resourceAllocation.workingHours
    });
    component.saveSchedule();
    expect(component.schedules[0].vaccineName).toBe('Updated Vaccine');
    expect(notificationService.success).toHaveBeenCalledWith('Schedule updated successfully');
  });

  it('should delete schedule after confirmation', async () => {
    const schedule = component.schedules[0];
    const initialLength = component.schedules.length;
    await component.deleteSchedule(schedule);
    expect(notificationService.confirm).toHaveBeenCalled();
    expect(component.schedules.length).toBe(initialLength - 1);
    expect(notificationService.success).toHaveBeenCalledWith('Schedule deleted successfully');
  });

  // Optimization Tests
  it('should optimize schedule score', (done) => {
    const schedule = component.schedules[0];
    const initialScore = schedule.optimizationScore;
    component.optimizeSchedule(schedule);
    expect(loaderService.show).toHaveBeenCalled();
    setTimeout(() => {
      expect(schedule.optimizationScore).toBeGreaterThanOrEqual(initialScore);
      expect(schedule.optimizationScore).toBeLessThanOrEqual(100);
      expect(schedule.recommendations.length).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Schedule optimized successfully');
      done();
    }, 1600);
  });

  // Scenario Simulation Tests
  it('should open scenario dialog', () => {
    component.openScenarioDialog();
    expect(component.showScenarioDialog).toBeTrue();
    expect(component.currentScenario).toBeNull();
  });

  it('should close scenario dialog', () => {
    component.showScenarioDialog = true;
    component.closeScenarioDialog();
    expect(component.showScenarioDialog).toBeFalse();
  });

  it('should run simulation and calculate results', (done) => {
    component.scenarioForm.patchValue({
      name: 'Test Scenario',
      description: 'Test description',
      personnelCount: 10,
      vaccinationPoints: 5,
      workingHoursPerDay: 8,
      daysAvailable: 30,
      targetCoverage: 90,
      highPriorityWeight: 3,
      mediumPriorityWeight: 2,
      lowPriorityWeight: 1
    });
    
    component.runSimulation();
    expect(loaderService.show).toHaveBeenCalled();
    
    setTimeout(() => {
      expect(component.currentScenario).toBeDefined();
      expect(component.currentScenario?.results.achievableCoverage).toBeGreaterThanOrEqual(0);
      expect(component.currentScenario?.results.dosesScheduled).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Simulation completed successfully');
      done();
    }, 2100);
  });

  // Helper Method Tests
  it('should return correct priority color', () => {
    expect(component.getPriorityColor('High')).toBe('warn');
    expect(component.getPriorityColor('Medium')).toBe('accent');
    expect(component.getPriorityColor('Low')).toBe('primary');
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('Completed')).toBe('primary');
    expect(component.getStatusColor('In Progress')).toBe('accent');
    expect(component.getStatusColor('Scheduled')).toBe('primary');
    expect(component.getStatusColor('Delayed')).toBe('warn');
  });

  it('should return correct score color', () => {
    expect(component.getScoreColor(85)).toBe('#4caf50');
    expect(component.getScoreColor(70)).toBe('#ff9800');
    expect(component.getScoreColor(50)).toBe('#f44336');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should format number correctly', () => {
    expect(component.formatNumber(1000)).toBe('1,000');
    expect(component.formatNumber(1500000)).toBe('1,500,000');
  });

  it('should format percentage correctly', () => {
    expect(component.formatPercentage(75.5)).toBe('76%');
    expect(component.formatPercentage(100)).toBe('100%');
  });

  // Export Tests
  it('should export data as CSV', (done) => {
    spyOn(component as any, 'downloadFile');
    component.exportData('csv');
    expect(loaderService.show).toHaveBeenCalled();
    setTimeout(() => {
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Dose schedules exported as CSV');
      done();
    }, 1100);
  });

  it('should export data as JSON', (done) => {
    spyOn(component as any, 'downloadFile');
    component.exportData('json');
    setTimeout(() => {
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Dose schedules exported as JSON');
      done();
    }, 1100);
  });

  it('should show info for PDF export', (done) => {
    component.exportData('pdf');
    setTimeout(() => {
      expect(notificationService.info).toHaveBeenCalledWith('PDF export will be implemented with backend integration');
      done();
    }, 1100);
  });

  // LocalStorage Tests
  it('should save schedules to localStorage', () => {
    spyOn(localStorage, 'setItem');
    (component as any).saveToLocalStorage();
    expect(localStorage.setItem).toHaveBeenCalledWith('doseSchedules', jasmine.any(String));
  });

  it('should load schedules from localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([{
      id: 'TEST-001',
      vaccineName: 'BCG',
      batchNumber: 'BATCH001',
      targetPopulation: 1000,
      scheduledDoses: 900,
      allocatedDoses: 450,
      remainingDoses: 450,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      priority: 'High',
      status: 'Scheduled',
      facilityId: 'FAC001',
      facilityName: 'Test Facility',
      ageGroup: '0-1 months',
      optimizationScore: 75,
      constraints: [],
      recommendations: [],
      resourceAllocation: {
        personnel: 5,
        vaccinationPoints: 2,
        workingHours: 8,
        daysRequired: 10,
        dailyCapacity: 800,
        utilizationRate: 56
      }
    }]));
    
    (component as any).loadSchedules();
    expect(component.schedules.length).toBeGreaterThan(0);
  });
});
