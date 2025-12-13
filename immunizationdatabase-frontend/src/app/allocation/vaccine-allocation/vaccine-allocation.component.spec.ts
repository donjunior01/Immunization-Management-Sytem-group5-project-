import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VaccineAllocationComponent } from './vaccine-allocation.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('VaccineAllocationComponent', () => {
  let component: VaccineAllocationComponent;
  let fixture: ComponentFixture<VaccineAllocationComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockAllocation: any = {
    id: 1,
    allocationNumber: 'AL202500001',
    vaccineName: 'BCG',
    batchNumber: 'BATCH-ABC123',
    manufacturer: 'Serum Institute',
    quantity: 1000,
    sourceFacility: 'City Hospital 1',
    destinationFacility: 'County Clinic 1',
    allocationDate: '2024-12-01',
    expectedDelivery: '2024-12-08',
    status: 'Pending' as const,
    priority: 'Medium' as const,
    transportMethod: 'Refrigerated Truck',
    requestedBy: 'Dr. Smith',
    notes: 'Urgent delivery required',
    storageConditions: '2-8°C (Cold Chain)'
  };

  beforeEach(async () => {
    const loaderServiceSpy = jasmine.createSpyObj('LoaderService', ['show', 'hide']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [VaccineAllocationComponent, NoopAnimationsModule],
      providers: [
        { provide: LoaderService, useValue: loaderServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(VaccineAllocationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize filter form with correct controls', () => {
      expect(component.filterForm.get('search')).toBeTruthy();
      expect(component.filterForm.get('vaccine')).toBeTruthy();
      expect(component.filterForm.get('status')).toBeTruthy();
      expect(component.filterForm.get('priority')).toBeTruthy();
      expect(component.filterForm.get('sourceFacility')).toBeTruthy();
      expect(component.filterForm.get('destinationFacility')).toBeTruthy();
      expect(component.filterForm.get('dateFrom')).toBeTruthy();
      expect(component.filterForm.get('dateTo')).toBeTruthy();
    });

    it('should initialize allocation form with correct controls', () => {
      expect(component.allocationForm.get('vaccineName')).toBeTruthy();
      expect(component.allocationForm.get('batchNumber')).toBeTruthy();
      expect(component.allocationForm.get('manufacturer')).toBeTruthy();
      expect(component.allocationForm.get('quantity')).toBeTruthy();
      expect(component.allocationForm.get('sourceFacility')).toBeTruthy();
      expect(component.allocationForm.get('destinationFacility')).toBeTruthy();
      expect(component.allocationForm.get('allocationDate')).toBeTruthy();
      expect(component.allocationForm.get('expectedDelivery')).toBeTruthy();
      expect(component.allocationForm.get('priority')).toBeTruthy();
      expect(component.allocationForm.get('transportMethod')).toBeTruthy();
      expect(component.allocationForm.get('storageConditions')).toBeTruthy();
      expect(component.allocationForm.get('temperature')).toBeTruthy();
      expect(component.allocationForm.get('requestedBy')).toBeTruthy();
      expect(component.allocationForm.get('notes')).toBeTruthy();
    });

    it('should initialize tracking form with correct controls', () => {
      expect(component.trackingForm.get('trackingNumber')).toBeTruthy();
      expect(component.trackingForm.get('status')).toBeTruthy();
      expect(component.trackingForm.get('actualDelivery')).toBeTruthy();
      expect(component.trackingForm.get('temperature')).toBeTruthy();
      expect(component.trackingForm.get('notes')).toBeTruthy();
    });

    it('should load data on init', () => {
      component.ngOnInit();
      expect(loaderService.show).toHaveBeenCalled();
      expect(component.allocations.length).toBeGreaterThan(0);
      expect(component.facilities.length).toBeGreaterThan(0);
    });
  });

  describe('Data Generation', () => {
    it('should generate mock allocations', () => {
      component.generateMockData();
      expect(component.allocations.length).toBe(50);
      expect(component.facilities.length).toBe(15);
    });

    it('should generate allocations with varied statuses', () => {
      component.generateMockData();
      const statuses = component.allocations.map(a => a.status);
      const uniqueStatuses = new Set(statuses);
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });

    it('should generate allocations with varied priorities', () => {
      component.generateMockData();
      const priorities = component.allocations.map(a => a.priority);
      const uniquePriorities = new Set(priorities);
      expect(uniquePriorities.size).toBeGreaterThan(1);
    });

    it('should generate allocations with different vaccine types', () => {
      component.generateMockData();
      const vaccines = component.allocations.map(a => a.vaccineName);
      const uniqueVaccines = new Set(vaccines);
      expect(uniqueVaccines.size).toBeGreaterThan(1);
    });

    it('should generate facilities with different types', () => {
      component.generateMockData();
      const types = component.facilities.map(f => f.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Statistics Calculation', () => {
    beforeEach(() => {
      component.allocations = [
        { ...mockAllocation, id: 1, status: 'Pending', quantity: 1000 },
        { ...mockAllocation, id: 2, status: 'In Transit', quantity: 500 },
        { ...mockAllocation, id: 3, status: 'Delivered', quantity: 750, actualDelivery: '2024-12-08' },
        { ...mockAllocation, id: 4, status: 'Cancelled', quantity: 300 }
      ];
    });

    it('should calculate total allocations', () => {
      component.calculateStats();
      expect(component.stats.totalAllocations).toBe(4);
    });

    it('should calculate pending allocations', () => {
      component.calculateStats();
      expect(component.stats.pending).toBe(1);
    });

    it('should calculate in transit allocations', () => {
      component.calculateStats();
      expect(component.stats.inTransit).toBe(1);
    });

    it('should calculate delivered allocations', () => {
      component.calculateStats();
      expect(component.stats.delivered).toBe(1);
    });

    it('should calculate cancelled allocations', () => {
      component.calculateStats();
      expect(component.stats.cancelled).toBe(1);
    });

    it('should calculate total quantity', () => {
      component.calculateStats();
      expect(component.stats.totalQuantity).toBe(2550);
    });

    it('should calculate average delivery time', () => {
      component.allocations = [
        { ...mockAllocation, status: 'Delivered', allocationDate: '2024-12-01', actualDelivery: '2024-12-08' },
        { ...mockAllocation, status: 'Delivered', allocationDate: '2024-12-01', actualDelivery: '2024-12-06' }
      ];
      component.calculateStats();
      expect(component.stats.avgDeliveryTime).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      component.allocations = [
        { ...mockAllocation, id: 1, allocationNumber: 'AL202500001', vaccineName: 'BCG', status: 'Pending', priority: 'High' },
        { ...mockAllocation, id: 2, allocationNumber: 'AL202500002', vaccineName: 'OPV', status: 'In Transit', priority: 'Medium' },
        { ...mockAllocation, id: 3, allocationNumber: 'AL202500003', vaccineName: 'DTP', status: 'Delivered', priority: 'Low' }
      ];
    });

    it('should apply filters with empty search', () => {
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(3);
    });

    it('should filter by search term in allocation number', () => {
      component.filterForm.patchValue({ search: 'AL202500002' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(1);
      expect(component.filteredAllocations[0].allocationNumber).toBe('AL202500002');
    });

    it('should filter by search term in vaccine name', () => {
      component.filterForm.patchValue({ search: 'bcg' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(1);
      expect(component.filteredAllocations[0].vaccineName).toBe('BCG');
    });

    it('should filter by vaccine type', () => {
      component.filterForm.patchValue({ vaccine: 'OPV' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(1);
      expect(component.filteredAllocations[0].vaccineName).toBe('OPV');
    });

    it('should filter by status', () => {
      component.filterForm.patchValue({ status: 'In Transit' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(1);
      expect(component.filteredAllocations[0].status).toBe('In Transit');
    });

    it('should filter by priority', () => {
      component.filterForm.patchValue({ priority: 'High' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(1);
      expect(component.filteredAllocations[0].priority).toBe('High');
    });

    it('should filter by source facility', () => {
      component.filterForm.patchValue({ sourceFacility: 'City Hospital 1' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(3);
    });

    it('should filter by destination facility', () => {
      component.filterForm.patchValue({ destinationFacility: 'County Clinic 1' });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(3);
    });

    it('should filter by date from', () => {
      component.filterForm.patchValue({ dateFrom: new Date('2024-12-02') });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(0);
    });

    it('should filter by date to', () => {
      component.filterForm.patchValue({ dateTo: new Date('2024-11-30') });
      component.applyFilters();
      expect(component.filteredAllocations.length).toBe(0);
    });

    it('should reset filters', () => {
      component.filterForm.patchValue({ search: 'test', vaccine: 'BCG', status: 'Pending' });
      component.resetFilters();
      expect(component.filterForm.get('search')?.value).toBe('');
      expect(component.filterForm.get('vaccine')?.value).toBe('');
      expect(component.filterForm.get('status')?.value).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.filteredAllocations = Array(25).fill(null).map((_, i) => ({
        ...mockAllocation,
        id: i + 1
      }));
    });

    it('should handle page event', () => {
      const event = { pageSize: 25, pageIndex: 1, length: 50 } as any;
      component.handlePageEvent(event);
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(1);
    });

    it('should get paginated allocations', () => {
      component.pageSize = 10;
      component.pageIndex = 0;
      const paginated = component.getPaginatedAllocations();
      expect(paginated.length).toBe(10);
    });

    it('should get second page of allocations', () => {
      component.pageSize = 10;
      component.pageIndex = 1;
      const paginated = component.getPaginatedAllocations();
      expect(paginated.length).toBe(10);
    });
  });

  describe('Form Operations', () => {
    it('should open create form', () => {
      component.openCreateForm();
      expect(component.showForm).toBe(true);
      expect(component.isEditMode).toBe(false);
      expect(component.currentStep).toBe(0);
    });

    it('should open edit form', () => {
      component.openEditForm(mockAllocation);
      expect(component.showForm).toBe(true);
      expect(component.isEditMode).toBe(true);
      expect(component.selectedAllocation).toEqual(mockAllocation);
    });

    it('should close form', () => {
      component.showForm = true;
      component.closeForm();
      expect(component.showForm).toBe(false);
    });

    it('should populate edit form with allocation data', () => {
      component.openEditForm(mockAllocation);
      expect(component.allocationForm.get('vaccineName')?.value).toBe(mockAllocation.vaccineName);
      expect(component.allocationForm.get('batchNumber')?.value).toBe(mockAllocation.batchNumber);
      expect(component.allocationForm.get('quantity')?.value).toBe(mockAllocation.quantity);
    });
  });

  describe('Allocation CRUD Operations', () => {
    it('should create new allocation', () => {
      component.allocationForm.patchValue({
        vaccineName: 'BCG',
        batchNumber: 'BATCH-TEST123',
        manufacturer: 'Test Manufacturer',
        quantity: 500,
        sourceFacility: 'City Hospital 1',
        destinationFacility: 'County Clinic 1',
        allocationDate: new Date(),
        expectedDelivery: new Date(),
        priority: 'High',
        transportMethod: 'Refrigerated Truck',
        storageConditions: '2-8°C (Cold Chain)',
        requestedBy: 'Dr. Smith'
      });

      const initialLength = component.allocations.length;
      component.saveAllocation();
      expect(component.allocations.length).toBe(initialLength + 1);
      expect(notificationService.success).toHaveBeenCalledWith('Allocation created successfully');
    });

    it('should update existing allocation', () => {
      component.allocations = [mockAllocation];
      component.isEditMode = true;
      component.selectedAllocation = mockAllocation;
      
      component.allocationForm.patchValue({
        vaccineName: 'Updated BCG',
        batchNumber: 'BATCH-UPDATED',
        manufacturer: 'Updated Manufacturer',
        quantity: 2000,
        sourceFacility: 'City Hospital 1',
        destinationFacility: 'County Clinic 1',
        allocationDate: new Date(),
        expectedDelivery: new Date(),
        priority: 'Urgent',
        transportMethod: 'Express Courier',
        storageConditions: '2-8°C (Cold Chain)',
        requestedBy: 'Dr. Johnson'
      });

      component.saveAllocation();
      expect(component.selectedAllocation?.vaccineName).toBe('Updated BCG');
      expect(notificationService.success).toHaveBeenCalledWith('Allocation updated successfully');
    });

    it('should not save allocation with invalid form', () => {
      component.allocationForm.patchValue({
        vaccineName: '',
        batchNumber: '',
        quantity: null
      });

      component.saveAllocation();
      expect(component.allocationForm.invalid).toBe(true);
    });

    it('should view allocation details', () => {
      component.viewDetails(mockAllocation);
      expect(component.detailAllocation).toEqual(mockAllocation);
      expect(component.showDetailDialog).toBe(true);
    });

    it('should close detail dialog', () => {
      component.showDetailDialog = true;
      component.closeDetailDialog();
      expect(component.showDetailDialog).toBe(false);
      expect(component.detailAllocation).toBeNull();
    });

    it('should delete allocation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.allocations = [mockAllocation];
      
      component.deleteAllocation(mockAllocation);
      expect(component.allocations.length).toBe(0);
      expect(notificationService.success).toHaveBeenCalledWith('Allocation deleted successfully');
    });

    it('should not delete allocation when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.allocations = [mockAllocation];
      
      component.deleteAllocation(mockAllocation);
      expect(component.allocations.length).toBe(1);
    });
  });

  describe('Form Validation', () => {
    it('should require vaccine name', () => {
      const control = component.allocationForm.get('vaccineName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require batch number', () => {
      const control = component.allocationForm.get('batchNumber');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate batch number pattern', () => {
      const control = component.allocationForm.get('batchNumber');
      control?.setValue('invalid batch');
      expect(control?.hasError('pattern')).toBe(true);
    });

    it('should accept valid batch number pattern', () => {
      const control = component.allocationForm.get('batchNumber');
      control?.setValue('BATCH-ABC123');
      expect(control?.hasError('pattern')).toBe(false);
    });

    it('should require manufacturer', () => {
      const control = component.allocationForm.get('manufacturer');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require quantity', () => {
      const control = component.allocationForm.get('quantity');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require quantity to be at least 1', () => {
      const control = component.allocationForm.get('quantity');
      control?.setValue(0);
      expect(control?.hasError('min')).toBe(true);
    });

    it('should require source facility', () => {
      const control = component.allocationForm.get('sourceFacility');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require destination facility', () => {
      const control = component.allocationForm.get('destinationFacility');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require allocation date', () => {
      const control = component.allocationForm.get('allocationDate');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require expected delivery', () => {
      const control = component.allocationForm.get('expectedDelivery');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require priority', () => {
      const control = component.allocationForm.get('priority');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require transport method', () => {
      const control = component.allocationForm.get('transportMethod');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require storage conditions', () => {
      const control = component.allocationForm.get('storageConditions');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('Tracking Operations', () => {
    it('should open tracking dialog', () => {
      component.openTrackingDialog(mockAllocation);
      expect(component.showTrackingDialog).toBe(true);
      expect(component.selectedAllocation).toEqual(mockAllocation);
    });

    it('should close tracking dialog', () => {
      component.showTrackingDialog = true;
      component.closeTrackingDialog();
      expect(component.showTrackingDialog).toBe(false);
      expect(component.selectedAllocation).toBeNull();
    });

    it('should update tracking information', () => {
      component.selectedAllocation = mockAllocation;
      component.trackingForm.patchValue({
        trackingNumber: 'TRK123456',
        status: 'In Transit',
        temperature: 4,
        notes: 'Package on the way'
      });

      component.updateTracking();
      expect(component.selectedAllocation?.trackingNumber).toBe('TRK123456');
      expect(component.selectedAllocation?.status).toBe('In Transit');
      expect(notificationService.success).toHaveBeenCalledWith('Tracking information updated successfully');
    });

    it('should require tracking number', () => {
      const control = component.trackingForm.get('trackingNumber');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require tracking status', () => {
      const control = component.trackingForm.get('status');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });
  });

  describe('Allocation Status Management', () => {
    it('should approve allocation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const allocation: any = { ...mockAllocation, status: 'Pending' as const };
      
      component.approveAllocation(allocation);
      expect(allocation.status).toBe('In Transit');
      expect(allocation.approvedBy).toBe('Current User');
      expect(allocation.trackingNumber).toBeDefined();
      expect(notificationService.success).toHaveBeenCalledWith('Allocation approved and in transit');
    });

    it('should cancel allocation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const allocation = { ...mockAllocation, status: 'Pending' as const };
      
      component.cancelAllocation(allocation);
      expect(allocation.status).toBe('Cancelled');
      expect(notificationService.success).toHaveBeenCalledWith('Allocation cancelled');
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      component.filteredAllocations = [mockAllocation];
    });

    it('should export allocations as CSV', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const link = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(link);
      spyOn(link, 'click');

      component.exportAllocations('csv');
      expect(notificationService.success).toHaveBeenCalledWith('Allocations exported as CSV successfully');
    });

    it('should export allocations as JSON', () => {
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(window.URL, 'revokeObjectURL');
      const link = document.createElement('a');
      spyOn(document, 'createElement').and.returnValue(link);
      spyOn(link, 'click');

      component.exportAllocations('json');
      expect(notificationService.success).toHaveBeenCalledWith('Allocations exported as JSON successfully');
    });

    it('should show message for PDF export', () => {
      component.exportAllocations('pdf');
      expect(notificationService.info).toHaveBeenCalledWith('PDF export coming soon');
    });
  });

  describe('Helper Methods', () => {
    it('should get status color for pending', () => {
      const color = component.getStatusColor('Pending');
      expect(color).toBe('#ff9800');
    });

    it('should get status color for in transit', () => {
      const color = component.getStatusColor('In Transit');
      expect(color).toBe('#2196f3');
    });

    it('should get status color for delivered', () => {
      const color = component.getStatusColor('Delivered');
      expect(color).toBe('#4caf50');
    });

    it('should get status color for cancelled', () => {
      const color = component.getStatusColor('Cancelled');
      expect(color).toBe('#f44336');
    });

    it('should get status color for delayed', () => {
      const color = component.getStatusColor('Delayed');
      expect(color).toBe('#ff5722');
    });

    it('should get priority color for low', () => {
      const color = component.getPriorityColor('Low');
      expect(color).toBe('#4caf50');
    });

    it('should get priority color for medium', () => {
      const color = component.getPriorityColor('Medium');
      expect(color).toBe('#ff9800');
    });

    it('should get priority color for high', () => {
      const color = component.getPriorityColor('High');
      expect(color).toBe('#ff5722');
    });

    it('should get priority color for urgent', () => {
      const color = component.getPriorityColor('Urgent');
      expect(color).toBe('#f44336');
    });

    it('should format date correctly', () => {
      const formatted = component.formatDate('2024-12-01');
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('2024');
    });

    it('should get field error for required field', () => {
      const control = component.allocationForm.get('vaccineName');
      control?.setValue('');
      control?.markAsTouched();
      const error = component.getFieldError('vaccineName');
      expect(error).toBe('Vaccine Name is required');
    });

    it('should get field error for min value', () => {
      const control = component.allocationForm.get('quantity');
      control?.setValue(0);
      control?.markAsTouched();
      const error = component.getFieldError('quantity');
      expect(error).toContain('must be at least');
    });

    it('should get field error for pattern', () => {
      const control = component.allocationForm.get('batchNumber');
      control?.setValue('invalid');
      control?.markAsTouched();
      const error = component.getFieldError('batchNumber');
      expect(error).toContain('format is invalid');
    });

    it('should get field label for known fields', () => {
      expect(component.getFieldLabel('vaccineName')).toBe('Vaccine Name');
      expect(component.getFieldLabel('batchNumber')).toBe('Batch Number');
      expect(component.getFieldLabel('quantity')).toBe('Quantity');
    });

    it('should return field name for unknown fields', () => {
      expect(component.getFieldLabel('unknownField')).toBe('unknownField');
    });

    it('should get unique facilities', () => {
      component.allocations = [
        { ...mockAllocation, sourceFacility: 'Hospital A', destinationFacility: 'Clinic B' },
        { ...mockAllocation, sourceFacility: 'Hospital A', destinationFacility: 'Clinic C' },
        { ...mockAllocation, sourceFacility: 'Hospital B', destinationFacility: 'Clinic B' }
      ];

      const facilities = component.getUniqueFacilities();
      expect(facilities).toContain('Hospital A');
      expect(facilities).toContain('Hospital B');
      expect(facilities).toContain('Clinic B');
      expect(facilities).toContain('Clinic C');
    });
  });
});
