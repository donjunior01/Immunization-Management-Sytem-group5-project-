import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WastageManagementComponent } from './wastage-management.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('WastageManagementComponent', () => {
  let component: WastageManagementComponent;
  let fixture: ComponentFixture<WastageManagementComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockRecord: any = {
    id: 1,
    batchNumber: 'BCG-2024-001',
    vaccineName: 'BCG',
    quantityWasted: 10,
    reason: 'Expired' as const,
    dateReported: new Date('2024-12-01'),
    reportedBy: 'Dr. John Doe',
    facilityId: 'FAC001',
    facilityName: 'Central Hospital',
    estimatedValue: 50,
    preventable: true,
    status: 'Reported' as const
  };

  beforeEach(async () => {
    const loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [WastageManagementComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(WastageManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('reason')).toBeTruthy();
      expect(component.filterForm.get('facilityId')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('preventable')).toBeTruthy();
      expect(component.filterForm.get('dateFrom')).toBeTruthy();
      expect(component.filterForm.get('dateTo')).toBeTruthy();
    });

    it('should initialize record form with correct controls', () => {
      expect(component.recordForm.get('batchNumber')).toBeTruthy();
      expect(component.recordForm.get('vaccineName')).toBeTruthy();
      expect(component.recordForm.get('quantityWasted')).toBeTruthy();
      expect(component.recordForm.get('reason')).toBeTruthy();
      expect(component.recordForm.get('dateReported')).toBeTruthy();
      expect(component.recordForm.get('reportedBy')).toBeTruthy();
      expect(component.recordForm.get('facilityId')).toBeTruthy();
      expect(component.recordForm.get('estimatedValue')).toBeTruthy();
    });

    it('should initialize investigation form with correct controls', () => {
      expect(component.investigationForm.get('recordId')).toBeTruthy();
      expect(component.investigationForm.get('findings')).toBeTruthy();
      expect(component.investigationForm.get('preventable')).toBeTruthy();
      expect(component.investigationForm.get('actionTaken')).toBeTruthy();
      expect(component.investigationForm.get('recommendations')).toBeTruthy();
      expect(component.investigationForm.get('status')).toBeTruthy();
    });
  });

  describe('Data Generation', () => {
    it('should generate mock data', () => {
      component.generateMockData();
      expect(component.wastageRecords.length).toBe(50);
    });

    it('should calculate statistics correctly', () => {
      component.wastageRecords = [mockRecord];
      component.calculateStats();
      expect(component.stats.totalWastage).toBe(10);
      expect(component.stats.totalValue).toBe(50);
      expect(component.stats.preventableWastage).toBe(10);
    });

    it('should calculate wastage by reason', () => {
      component.wastageRecords = [mockRecord];
      component.calculateStats();
      component.calculateWastageByReason();
      expect(component.wastageByReason.length).toBeGreaterThan(0);
      expect(component.wastageByReason[0].reason).toBe('Expired');
    });

    it('should generate trend data', () => {
      component.wastageRecords = [mockRecord];
      component.generateTrendData();
      expect(component.trendData.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.wastageRecords = [mockRecord];
    });

    it('should filter by search term', () => {
      component.filterForm.patchValue({ search: 'BCG' });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should filter by reason', () => {
      component.filterForm.patchValue({ reason: 'Expired' });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should filter by facility', () => {
      component.filterForm.patchValue({ facilityId: 'FAC001' });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should filter by status', () => {
      component.filterForm.patchValue({ status: 'Reported' });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should filter by preventable', () => {
      component.filterForm.patchValue({ preventable: 'true' });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should filter by date range', () => {
      const dateFrom = new Date('2024-11-01');
      const dateTo = new Date('2024-12-31');
      component.filterForm.patchValue({ dateFrom, dateTo });
      component.applyFilters();
      expect(component.filteredRecords.length).toBe(1);
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({ search: 'test', reason: 'Expired' });
      component.resetFilters();
      expect(component.filterForm.value.search).toBe('');
      expect(component.filterForm.value.reason).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.filteredRecords = Array(50).fill(null).map((_, i) => ({ ...mockRecord, id: i + 1 }));
    });

    it('should handle page event', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 50 } as any;
      component.handlePageEvent(event);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should return correct paginated records', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      const records = component.getPaginatedRecords();
      expect(records.length).toBe(10);
    });
  });

  describe('Record Management', () => {
    it('should open create record dialog', () => {
      component.openRecordDialog();
      expect(component.showRecordDialog).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should open edit record dialog', () => {
      component.openRecordDialog(mockRecord);
      expect(component.showRecordDialog).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedRecord).toBe(mockRecord);
    });

    it('should close record dialog', () => {
      component.showRecordDialog = true;
      component.closeRecordDialog();
      expect(component.showRecordDialog).toBe(false);
      expect(component.selectedRecord).toBeNull();
    });

    it('should save new record', () => {
      spyOn(localStorage, 'setItem');
      component.recordForm.patchValue({
        batchNumber: 'TEST-001',
        vaccineName: 'BCG',
        quantityWasted: 5,
        reason: 'Expired',
        dateReported: new Date(),
        reportedBy: 'Test User',
        facilityId: 'FAC001',
        estimatedValue: 25,
        status: 'Reported'
      });

      component.saveRecord();
      expect(component.wastageRecords.length).toBeGreaterThan(0);
      expect(notificationService.success).toHaveBeenCalledWith('Wastage record created successfully');
    });

    it('should update existing record', () => {
      spyOn(localStorage, 'setItem');
      component.isEditMode = true;
      component.selectedRecord = mockRecord;
      component.recordForm.patchValue({
        ...mockRecord,
        quantityWasted: 15
      });

      component.saveRecord();
      expect(component.selectedRecord?.quantityWasted).toBe(15);
      expect(notificationService.success).toHaveBeenCalledWith('Wastage record updated successfully');
    });

    it('should not save with invalid form', () => {
      component.recordForm.reset();
      component.saveRecord();
      expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('should delete record', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(localStorage, 'setItem');
      component.wastageRecords = [mockRecord];

      component.deleteRecord(mockRecord);
      expect(component.wastageRecords.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalledWith('Wastage record deleted successfully');
    });

    it('should not delete when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.wastageRecords = [mockRecord];

      component.deleteRecord(mockRecord);
      expect(component.wastageRecords.length).toBe(1);
    });
  });

  describe('Form Validation', () => {
    it('should require batch number', () => {
      const control = component.recordForm.get('batchNumber');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate batch number minimum length', () => {
      const control = component.recordForm.get('batchNumber');
      control?.setValue('AB');
      expect(control?.hasError('minlength')).toBe(true);
    });

    it('should require vaccine name', () => {
      const control = component.recordForm.get('vaccineName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require quantity wasted', () => {
      const control = component.recordForm.get('quantityWasted');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate quantity minimum value', () => {
      const control = component.recordForm.get('quantityWasted');
      control?.setValue(0);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should require reason', () => {
      const control = component.recordForm.get('reason');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require date reported', () => {
      const control = component.recordForm.get('dateReported');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require reported by', () => {
      const control = component.recordForm.get('reportedBy');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require facility', () => {
      const control = component.recordForm.get('facilityId');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require estimated value', () => {
      const control = component.recordForm.get('estimatedValue');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('Record Details', () => {
    it('should view record details', () => {
      component.viewRecordDetails(mockRecord);
      expect(component.selectedRecord).toBe(mockRecord);
      expect(component.showDetailDialog).toBe(true);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.selectedRecord = mockRecord;
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBe(false);
      expect(component.selectedRecord).toBeNull();
    });
  });

  describe('Investigation', () => {
    it('should open investigation dialog', () => {
      component.openInvestigationDialog(mockRecord);
      expect(component.showInvestigationDialog).toBe(true);
      expect(component.selectedRecord).toBe(mockRecord);
    });

    it('should close investigation dialog', () => {
      component.showInvestigationDialog = true;
      component.closeInvestigationDialog();
      expect(component.showInvestigationDialog).toBe(false);
      expect(component.selectedRecord).toBeNull();
    });

    it('should save investigation', () => {
      spyOn(localStorage, 'setItem');
      component.selectedRecord = mockRecord;
      component.investigationForm.patchValue({
        recordId: 1,
        findings: 'Investigation findings',
        preventable: false,
        actionTaken: 'Corrective action taken',
        recommendations: 'Future recommendations',
        status: 'Resolved'
      });

      component.saveInvestigation();
      expect(component.selectedRecord?.status).toBe('Resolved');
      expect(notificationService.success).toHaveBeenCalledWith('Investigation completed successfully');
    });

    it('should not save investigation with invalid form', () => {
      component.selectedRecord = mockRecord;
      component.investigationForm.reset();
      component.saveInvestigation();
      expect(notificationService.error).toHaveBeenCalledWith('Please fill in all required fields');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.filteredRecords = [mockRecord];
    });

    it('should export as CSV', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportRecords('csv');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to CSV successfully');
    });

    it('should export as JSON', () => {
      spyOn<any>(component, 'downloadFile');
      component.exportRecords('json');
      expect((component as any).downloadFile).toHaveBeenCalled();
      expect(notificationService.success).toHaveBeenCalledWith('Exported to JSON successfully');
    });

    it('should show message for PDF export', () => {
      component.exportRecords('pdf');
      expect(notificationService.info).toHaveBeenCalledWith('PDF export will be implemented with a reporting library');
    });
  });

  describe('Helper Methods', () => {
    it('should get correct reason color', () => {
      expect(component.getReasonColor('Cold Chain Failure')).toBe('warn');
      expect(component.getReasonColor('Expired')).toBe('accent');
      expect(component.getReasonColor('Open Vial Wastage')).toBe('primary');
    });

    it('should get correct status color', () => {
      expect(component.getStatusColor('Closed')).toBe('primary');
      expect(component.getStatusColor('Resolved')).toBe('accent');
      expect(component.getStatusColor('Under Investigation')).toBe('accent');
      expect(component.getStatusColor('Reported')).toBe('warn');
    });

    it('should format date correctly', () => {
      const date = new Date('2024-12-01T10:00:00');
      const formatted = component.formatDate(date);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('12');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format currency correctly', () => {
      expect(component.formatCurrency(50)).toBe('$50.00');
      expect(component.formatCurrency(123.456)).toBe('$123.46');
    });

    it('should get action taken for reason', () => {
      const action = component.getActionTaken('Expired');
      expect(action).toContain('FEFO');
    });
  });

  describe('LocalStorage', () => {
    it('should save to localStorage', () => {
      spyOn(localStorage, 'setItem');
      component.wastageRecords = [mockRecord];
      
      (component as any).saveToLocalStorage();
      expect(localStorage.setItem).toHaveBeenCalledWith('wastageRecords', jasmine.any(String));
    });

    it('should load from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify([mockRecord]));
      
      (component as any).loadFromLocalStorage();
      expect(component.wastageRecords.length).toBe(1);
    });
  });
});
