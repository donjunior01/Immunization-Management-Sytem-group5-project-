import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { AdverseEventsComponent } from './adverse-events.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('AdverseEventsComponent', () => {
  let component: AdverseEventsComponent;
  let fixture: ComponentFixture<AdverseEventsComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info', 'confirm']);
    notificationSpy.confirm.and.returnValue();

    await TestBed.configureTestingModule({
      imports: [
        AdverseEventsComponent,
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
        MatProgressSpinnerModule,
        MatDialogModule,
        MatTabsModule,
        MatCheckboxModule,
        MatRadioModule
      ],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(AdverseEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filterForm with 7 controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccineName')).toBeTruthy();
      expect(component.filterForm.get('severity')).toBeTruthy();
      expect(component.filterForm.get('outcome')).toBeTruthy();
      expect(component.filterForm.get('causality')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('dateRange')).toBeTruthy();
    });

    it('should initialize eventForm with 29 controls', () => {
      expect(component.eventForm.get('patientName')).toBeTruthy();
      expect(component.eventForm.get('patientAge')).toBeTruthy();
      expect(component.eventForm.get('patientGender')).toBeTruthy();
      expect(component.eventForm.get('vaccineName')).toBeTruthy();
      expect(component.eventForm.get('vaccineManufacturer')).toBeTruthy();
      expect(component.eventForm.get('batchNumber')).toBeTruthy();
      expect(component.eventForm.get('vaccinationDate')).toBeTruthy();
      expect(component.eventForm.get('eventDate')).toBeTruthy();
      expect(component.eventForm.get('reportDate')).toBeTruthy();
      expect(component.eventForm.get('reportedBy')).toBeTruthy();
      expect(component.eventForm.get('reporterType')).toBeTruthy();
      expect(component.eventForm.get('severity')).toBeTruthy();
      expect(component.eventForm.get('eventType')).toBeTruthy();
      expect(component.eventForm.get('symptoms')).toBeTruthy();
      expect(component.eventForm.get('description')).toBeTruthy();
      expect(component.eventForm.get('medicalHistory')).toBeTruthy();
      expect(component.eventForm.get('concomitantMedications')).toBeTruthy();
      expect(component.eventForm.get('allergies')).toBeTruthy();
      expect(component.eventForm.get('previousReactions')).toBeTruthy();
      expect(component.eventForm.get('outcome')).toBeTruthy();
      expect(component.eventForm.get('hospitalized')).toBeTruthy();
      expect(component.eventForm.get('hospitalizationDays')).toBeTruthy();
      expect(component.eventForm.get('treatmentProvided')).toBeTruthy();
      expect(component.eventForm.get('followUpRequired')).toBeTruthy();
      expect(component.eventForm.get('followUpDate')).toBeTruthy();
      expect(component.eventForm.get('followUpNotes')).toBeTruthy();
      expect(component.eventForm.get('reportedToAuthority')).toBeTruthy();
      expect(component.eventForm.get('authorityReportDate')).toBeTruthy();
      expect(component.eventForm.get('regulatoryActionTaken')).toBeTruthy();
    });

    it('should initialize causalityForm with 7 controls', () => {
      expect(component.causalityForm.get('temporalRelationship')).toBeTruthy();
      expect(component.causalityForm.get('biologicalPlausibility')).toBeTruthy();
      expect(component.causalityForm.get('previousExposure')).toBeTruthy();
      expect(component.causalityForm.get('otherCauses')).toBeTruthy();
      expect(component.causalityForm.get('rechallenge')).toBeTruthy();
      expect(component.causalityForm.get('specificity')).toBeTruthy();
      expect(component.causalityForm.get('notes')).toBeTruthy();
    });

    it('should set default values for eventForm', () => {
      expect(component.eventForm.get('severity')?.value).toBe('Mild');
      expect(component.eventForm.get('outcome')?.value).toBe('Unknown');
      expect(component.eventForm.get('reporterType')?.value).toBe('Healthcare Provider');
      expect(component.eventForm.get('reportDate')?.value).toBeInstanceOf(Date);
    });
  });

  describe('Mock Data Generation', () => {
    it('should generate 100 mock events', () => {
      expect(component.events.length).toBe(100);
    });

    it('should generate events with all required fields', () => {
      const event = component.events[0];
      expect(event.id).toBeTruthy();
      expect(event.patientId).toBeTruthy();
      expect(event.patientName).toBeTruthy();
      expect(event.vaccineName).toBeTruthy();
      expect(event.severity).toBeTruthy();
      expect(event.status).toBeTruthy();
    });

    it('should generate events with valid severity values', () => {
      component.events.forEach(event => {
        expect(component.severities).toContain(event.severity);
      });
    });

    it('should generate events with valid outcome values', () => {
      component.events.forEach(event => {
        expect(component.outcomes).toContain(event.outcome);
      });
    });

    it('should generate events with valid causality categories', () => {
      component.events.forEach(event => {
        expect(component.causalityCategories).toContain(event.causalityCategory);
      });
    });

    it('should generate events with valid status values', () => {
      component.events.forEach(event => {
        expect(component.statuses).toContain(event.status);
      });
    });
  });

  describe('Analytics Calculation', () => {
    it('should calculate totalEvents correctly', () => {
      expect(component.analytics.totalEvents).toBe(component.events.length);
    });

    it('should calculate severity counts correctly', () => {
      const mildCount = component.events.filter(e => e.severity === 'Mild').length;
      const moderateCount = component.events.filter(e => e.severity === 'Moderate').length;
      const severeCount = component.events.filter(e => e.severity === 'Severe').length;
      const fatalCount = component.events.filter(e => e.severity === 'Fatal').length;

      expect(component.analytics.mildEvents).toBe(mildCount);
      expect(component.analytics.moderateEvents).toBe(moderateCount);
      expect(component.analytics.severeEvents).toBe(severeCount);
      expect(component.analytics.fatalEvents).toBe(fatalCount);
    });

    it('should calculate status counts correctly', () => {
      const underInvestigationCount = component.events.filter(e => e.status === 'Under Investigation').length;
      const investigatedCount = component.events.filter(e => e.status === 'Investigated').length;
      const closedCount = component.events.filter(e => e.status === 'Closed').length;

      expect(component.analytics.underInvestigation).toBe(underInvestigationCount);
      expect(component.analytics.investigated).toBe(investigatedCount);
      expect(component.analytics.closed).toBe(closedCount);
    });

    it('should calculate averageOnsetTime correctly', () => {
      expect(component.analytics.averageOnsetTime).toBeGreaterThan(0);
      expect(component.analytics.averageOnsetTime).toBeLessThanOrEqual(168);
    });

    it('should calculate hospitalizationRate correctly', () => {
      const hospitalizedCount = component.events.filter(e => e.hospitalized).length;
      const expectedRate = (hospitalizedCount / component.events.length) * 100;
      expect(component.analytics.hospitalizationRate).toBeCloseTo(expectedRate, 1);
    });

    it('should calculate recoveryRate correctly', () => {
      const recoveredCount = component.events.filter(e => e.outcome === 'Recovered').length;
      const expectedRate = (recoveredCount / component.events.length) * 100;
      expect(component.analytics.recoveryRate).toBeCloseTo(expectedRate, 1);
    });

    it('should populate topSymptoms array', () => {
      expect(component.analytics.topSymptoms).toBeTruthy();
      expect(component.analytics.topSymptoms.length).toBeGreaterThan(0);
      expect(component.analytics.topSymptoms.length).toBeLessThanOrEqual(10);
    });

    it('should populate eventsByVaccine array', () => {
      expect(component.analytics.eventsByVaccine).toBeTruthy();
      expect(component.analytics.eventsByVaccine.length).toBeGreaterThan(0);
    });

    it('should populate eventsByAge array', () => {
      expect(component.analytics.eventsByAge).toBeTruthy();
      expect(component.analytics.eventsByAge.length).toBe(8);
    });

    it('should calculate vaccine rates correctly', () => {
      component.analytics.eventsByVaccine.forEach(item => {
        expect(item.rate).toBeGreaterThanOrEqual(0);
        expect(item.rate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Trend Generation', () => {
    it('should generate trend data', () => {
      expect(component.trendData).toBeTruthy();
      expect(component.trendData.length).toBeGreaterThan(0);
    });

    it('should generate trends with all required fields', () => {
      const trend = component.trendData[0];
      expect(trend.month).toBeTruthy();
      expect(trend.totalEvents).toBeDefined();
      expect(trend.mildEvents).toBeDefined();
      expect(trend.moderateEvents).toBeDefined();
      expect(trend.severeEvents).toBeDefined();
      expect(trend.fatalEvents).toBeDefined();
      expect(trend.reportingRate).toBeDefined();
    });

    it('should calculate reporting rates', () => {
      component.trendData.forEach(trend => {
        expect(trend.reportingRate).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by search text', () => {
      const searchTerm = component.events[0].patientName.substring(0, 5);
      component.filterForm.patchValue({ search: searchTerm });
      component.applyFilters();
      expect(component.filteredEvents.length).toBeGreaterThan(0);
    });

    it('should filter by vaccine name', () => {
      const vaccineName = component.events[0].vaccineName;
      component.filterForm.patchValue({ vaccineName });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.vaccineName).toBe(vaccineName);
      });
    });

    it('should filter by severity', () => {
      const severity = 'Mild';
      component.filterForm.patchValue({ severity });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.severity).toBe(severity);
      });
    });

    it('should filter by outcome', () => {
      const outcome = 'Recovered';
      component.filterForm.patchValue({ outcome });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.outcome).toBe(outcome);
      });
    });

    it('should filter by causality', () => {
      const causality = 'Probable';
      component.filterForm.patchValue({ causality });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.causalityCategory).toBe(causality);
      });
    });

    it('should filter by status', () => {
      const status = 'Closed';
      component.filterForm.patchValue({ status });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.status).toBe(status);
      });
    });

    it('should filter by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-06-30');
      component.filterForm.patchValue({
        dateRange: { start: startDate, end: endDate }
      });
      component.applyFilters();
      component.filteredEvents.forEach(event => {
        expect(event.reportDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(event.reportDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({ search: 'test', severity: 'Mild' });
      component.resetFilters();
      expect(component.filterForm.get('search')?.value).toBe('');
      expect(component.filterForm.get('severity')?.value).toBe('');
    });
  });

  describe('Pagination', () => {
    it('should update displayed events on page change', () => {
      const pageEvent = { pageIndex: 1, pageSize: 10, length: 100 };
      component.onPageChange(pageEvent);
      expect(component.pageIndex).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('should display correct number of events per page', () => {
      component.pageSize = 10;
      component.updateDisplayedEvents();
      expect(component.displayedEvents.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Event Dialog', () => {
    it('should open event dialog in create mode', () => {
      component.openEventDialog();
      expect(component.showEventDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should open event dialog in edit mode', () => {
      const event = component.events[0];
      component.openEventDialog(event);
      expect(component.showEventDialog).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.eventForm.get('patientName')?.value).toBe(event.patientName);
    });

    it('should close event dialog', () => {
      component.openEventDialog();
      component.closeEventDialog();
      expect(component.showEventDialog).toBe(false);
    });

    it('should reset form on close', () => {
      component.eventForm.patchValue({ patientName: 'Test' });
      component.closeEventDialog();
      expect(component.eventForm.get('patientName')?.value).toBe('');
    });
  });

  describe('Event CRUD Operations', () => {
    it('should save new event', () => {
      component.openEventDialog();
      component.eventForm.patchValue({
        patientName: 'Test Patient',
        patientAge: 25,
        patientGender: 'Male',
        vaccineName: 'COVID-19',
        vaccineManufacturer: 'Test Manufacturer',
        batchNumber: 'BATCH001',
        vaccinationDate: new Date('2024-01-01'),
        eventDate: new Date('2024-01-02'),
        reportDate: new Date('2024-01-03'),
        reportedBy: 'Test Reporter',
        reporterType: 'Healthcare Provider',
        severity: 'Mild',
        eventType: 'Local reaction',
        symptoms: ['Fever'],
        description: 'Test description',
        outcome: 'Recovered',
        hospitalized: false,
        treatmentProvided: 'Rest',
        followUpRequired: false,
        reportedToAuthority: false
      });

      const initialLength = component.events.length;
      component.saveEvent();
      expect(component.events.length).toBe(initialLength + 1);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should update existing event', () => {
      const event = component.events[0];
      component.openEventDialog(event);
      const newName = 'Updated Patient';
      component.eventForm.patchValue({ patientName: newName });
      component.saveEvent();
      expect(component.events[0].patientName).toBe(newName);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should calculate onset time on save', () => {
      component.openEventDialog();
      const vaccinationDate = new Date('2024-01-01T10:00:00');
      const eventDate = new Date('2024-01-02T14:00:00');
      component.eventForm.patchValue({
        patientName: 'Test',
        patientAge: 30,
        patientGender: 'Female',
        vaccineName: 'Measles',
        vaccineManufacturer: 'Test',
        batchNumber: 'TEST123',
        vaccinationDate,
        eventDate,
        reportDate: new Date(),
        reportedBy: 'Test',
        reporterType: 'Healthcare Provider',
        severity: 'Mild',
        eventType: 'Test',
        symptoms: ['Fever'],
        description: 'Test',
        outcome: 'Recovered'
      });
      component.saveEvent();
      const expectedHours = 28;
      expect(component.events[0].onsetTime).toBeCloseTo(expectedHours, 0);
    });

    it('should delete event', () => {
      const event = component.events[0];
      const initialLength = component.events.length;
      component.deleteEvent(event);
      expect(component.events.length).toBe(initialLength - 1);
      expect(notificationService.success).toHaveBeenCalled();
    });

    it('should not save invalid event', () => {
      component.openEventDialog();
      component.eventForm.patchValue({ patientName: '' });
      const initialLength = component.events.length;
      component.saveEvent();
      expect(component.events.length).toBe(initialLength);
    });
  });

  describe('WHO Causality Assessment', () => {
    it('should open causality dialog', () => {
      const event = component.events[0];
      component.openCausalityDialog(event);
      expect(component.showCausalityDialog).toBe(true);
      expect(component.selectedEvent).toBe(event);
    });

    it('should close causality dialog', () => {
      component.openCausalityDialog(component.events[0]);
      component.closeCausalityDialog();
      expect(component.showCausalityDialog).toBe(false);
      expect(component.selectedEvent).toBeNull();
    });

    it('should calculate causality score correctly', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 3,
        biologicalPlausibility: 3,
        previousExposure: 3,
        otherCauses: 3,
        rechallenge: 3,
        specificity: 3
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(18);
      expect(result.category).toBe('Certain');
    });

    it('should classify as Certain for score >= 15', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 3,
        biologicalPlausibility: 3,
        previousExposure: 3,
        otherCauses: 2,
        rechallenge: 2,
        specificity: 2
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(15);
      expect(result.category).toBe('Certain');
    });

    it('should classify as Probable for score >= 12', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 2,
        biologicalPlausibility: 2,
        previousExposure: 2,
        otherCauses: 2,
        rechallenge: 2,
        specificity: 2
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(12);
      expect(result.category).toBe('Probable');
    });

    it('should classify as Possible for score >= 8', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 2,
        biologicalPlausibility: 2,
        previousExposure: 1,
        otherCauses: 1,
        rechallenge: 1,
        specificity: 1
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(8);
      expect(result.category).toBe('Possible');
    });

    it('should classify as Unlikely for score >= 4', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 1,
        biologicalPlausibility: 1,
        previousExposure: 1,
        otherCauses: 1,
        rechallenge: 0,
        specificity: 0
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(4);
      expect(result.category).toBe('Unlikely');
    });

    it('should classify as Unclassifiable for score = 0', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 0,
        biologicalPlausibility: 0,
        previousExposure: 0,
        otherCauses: 0,
        rechallenge: 0,
        specificity: 0
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(0);
      expect(result.category).toBe('Unclassifiable');
    });

    it('should classify as Unrelated for score < 4 but > 0', () => {
      component.causalityForm.patchValue({
        temporalRelationship: 1,
        biologicalPlausibility: 1,
        previousExposure: 0,
        otherCauses: 0,
        rechallenge: 0,
        specificity: 0
      });
      const result = component.calculateCausalityScore();
      expect(result.totalScore).toBe(2);
      expect(result.category).toBe('Unrelated');
    });

    it('should save causality assessment', () => {
      const event = component.events[0];
      component.openCausalityDialog(event);
      component.causalityForm.patchValue({
        temporalRelationship: 3,
        biologicalPlausibility: 3,
        previousExposure: 2,
        otherCauses: 2,
        rechallenge: 2,
        specificity: 2,
        notes: 'Test assessment'
      });
      component.saveCausality();
      expect(component.events[0].causalityScore).toBe(14);
      expect(component.events[0].causalityCategory).toBe('Probable');
      expect(component.events[0].status).toBe('Investigated');
      expect(notificationService.success).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    it('should export as CSV', () => {
      spyOn(component as any, 'downloadFile');
      component.exportData('csv');
      expect(loaderService.show).toHaveBeenCalled();
    });

    it('should export as JSON', () => {
      spyOn(component as any, 'downloadFile');
      component.exportData('json');
      expect(loaderService.show).toHaveBeenCalled();
    });

    it('should show info for PDF export', () => {
      component.exportData('pdf');
      expect(notificationService.info).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should return correct severity colors', () => {
      expect(component.getSeverityColor('Mild')).toBe('#10b981');
      expect(component.getSeverityColor('Moderate')).toBe('#f59e0b');
      expect(component.getSeverityColor('Severe')).toBe('#ff6b35');
      expect(component.getSeverityColor('Life-Threatening')).toBe('#ef4444');
      expect(component.getSeverityColor('Fatal')).toBe('#991b1b');
    });

    it('should return correct outcome colors', () => {
      expect(component.getOutcomeColor('Recovered')).toBe('#10b981');
      expect(component.getOutcomeColor('Recovering')).toBe('#3b82f6');
      expect(component.getOutcomeColor('Not Recovered')).toBe('#f59e0b');
      expect(component.getOutcomeColor('Fatal')).toBe('#ef4444');
      expect(component.getOutcomeColor('Unknown')).toBe('#6b7280');
    });

    it('should return correct causality colors', () => {
      expect(component.getCausalityColor('Certain')).toBe('#ef4444');
      expect(component.getCausalityColor('Probable')).toBe('#ff6b35');
      expect(component.getCausalityColor('Possible')).toBe('#f59e0b');
      expect(component.getCausalityColor('Unlikely')).toBe('#10b981');
      expect(component.getCausalityColor('Unrelated')).toBe('#6b7280');
      expect(component.getCausalityColor('Unclassifiable')).toBe('#9ca3af');
    });

    it('should return correct status colors', () => {
      expect(component.getStatusColor('Reported')).toBe('#3b82f6');
      expect(component.getStatusColor('Under Investigation')).toBe('#f59e0b');
      expect(component.getStatusColor('Investigated')).toBe('#8b5cf6');
      expect(component.getStatusColor('Closed')).toBe('#10b981');
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = component.formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should format months correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = component.formatMonth(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
    });

    it('should format numbers correctly', () => {
      expect(component.formatNumber(1000)).toBe('1,000');
      expect(component.formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format percentages correctly', () => {
      expect(component.formatPercentage(45.678)).toBe('45.7%');
      expect(component.formatPercentage(100)).toBe('100.0%');
    });

    it('should format hours correctly', () => {
      expect(component.formatHours(12)).toBe('12 hours');
      expect(component.formatHours(1)).toBe('1 hour');
      expect(component.formatHours(24)).toBe('1 day');
      expect(component.formatHours(48)).toBe('2 days');
    });
  });

  describe('LocalStorage', () => {
    it('should save events to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component['saveToLocalStorage']();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'adverseEvents',
        jasmine.any(String)
      );
    });

    it('should load events from localStorage', () => {
      const mockEvents = JSON.stringify([component.events[0]]);
      spyOn(localStorage, 'getItem').and.returnValue(mockEvents);
      component['loadEvents']();
      expect(component.events.length).toBe(1);
    });

    it('should generate mock data if localStorage is empty', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      component['loadEvents']();
      expect(component.events.length).toBe(100);
    });
  });
});
