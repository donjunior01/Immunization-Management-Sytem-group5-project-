import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FacilityManagementComponent } from './facility-management.component';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

describe('FacilityManagementComponent', () => {
  let component: FacilityManagementComponent;
  let fixture: ComponentFixture<FacilityManagementComponent>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const loaderSpy = jasmine.createSpyObj('LoaderService', ['show']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    await TestBed.configureTestingModule({
      imports: [
        FacilityManagementComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatMenuModule,
        MatTooltipModule,
        MatDividerModule
      ],
      providers: [
        { provide: LoaderService, useValue: loaderSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    loaderService = TestBed.inject(LoaderService) as jasmine.SpyObj<LoaderService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    fixture = TestBed.createComponent(FacilityManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on component creation', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.facilityForm).toBeDefined();
    expect(component.filterForm.get('search')).toBeDefined();
    expect(component.filterForm.get('type')).toBeDefined();
    expect(component.filterForm.get('status')).toBeDefined();
    expect(component.filterForm.get('state')).toBeDefined();
  });

  it('should generate 50 mock facilities', () => {
    expect(component.facilities.length).toBe(50);
    expect(component.filteredFacilities.length).toBe(50);
  });

  it('should calculate stats correctly', () => {
    component.calculateStats();
    expect(component.stats.total).toBe(50);
    expect(component.stats.active).toBeGreaterThan(0);
    expect(component.stats.inactive).toBeGreaterThanOrEqual(0);
    expect(component.stats.pending).toBeGreaterThanOrEqual(0);
    expect(component.stats.totalCapacity).toBeGreaterThan(0);
    expect(component.stats.utilizationRate).toBeGreaterThan(0);
  });

  it('should have correct utilization rate calculation', () => {
    component.calculateStats();
    const expectedRate = Math.round(
      (component.facilities.reduce((sum, f) => sum + f.currentStock, 0) /
        component.facilities.reduce((sum, f) => sum + f.capacity, 0)) * 100
    );
    expect(component.stats.utilizationRate).toBe(expectedRate);
  });

  it('should apply filters when filter form changes', (done) => {
    component.filterForm.get('search')?.setValue('Hospital');
    setTimeout(() => {
      expect(component.filteredFacilities.length).toBeLessThanOrEqual(component.facilities.length);
      done();
    }, 400);
  });

  it('should filter by facility type', (done) => {
    component.filterForm.get('type')?.setValue('Hospital');
    setTimeout(() => {
      const hospitals = component.filteredFacilities.filter(f => f.type === 'Hospital');
      expect(hospitals.length).toBe(component.filteredFacilities.length);
      done();
    }, 400);
  });

  it('should filter by status', (done) => {
    component.filterForm.get('status')?.setValue('Active');
    setTimeout(() => {
      const active = component.filteredFacilities.filter(f => f.status === 'Active');
      expect(active.length).toBe(component.filteredFacilities.length);
      done();
    }, 400);
  });

  it('should filter by state', (done) => {
    component.filterForm.get('state')?.setValue('California');
    setTimeout(() => {
      const california = component.filteredFacilities.filter(f => f.state === 'California');
      expect(california.length).toBe(component.filteredFacilities.length);
      done();
    }, 400);
  });

  it('should search by facility name', (done) => {
    const facility = component.facilities[0];
    component.filterForm.get('search')?.setValue(facility.name);
    setTimeout(() => {
      expect(component.filteredFacilities.length).toBeGreaterThan(0);
      expect(component.filteredFacilities.some(f => f.name.includes(facility.name))).toBeTrue();
      done();
    }, 400);
  });

  it('should search by facility code', (done) => {
    const facility = component.facilities[0];
    component.filterForm.get('search')?.setValue(facility.code);
    setTimeout(() => {
      expect(component.filteredFacilities.length).toBeGreaterThan(0);
      expect(component.filteredFacilities.some(f => f.code === facility.code)).toBeTrue();
      done();
    }, 400);
  });

  it('should search by city', (done) => {
    const facility = component.facilities[0];
    component.filterForm.get('search')?.setValue(facility.city);
    setTimeout(() => {
      expect(component.filteredFacilities.length).toBeGreaterThan(0);
      done();
    }, 400);
  });

  it('should search by manager name', (done) => {
    const facility = component.facilities[0];
    component.filterForm.get('search')?.setValue(facility.managerName);
    setTimeout(() => {
      expect(component.filteredFacilities.length).toBeGreaterThan(0);
      done();
    }, 400);
  });

  it('should reset filters', () => {
    component.filterForm.get('search')?.setValue('test');
    component.filterForm.get('type')?.setValue('Hospital');
    component.filterForm.get('status')?.setValue('Active');
    component.filterForm.get('state')?.setValue('California');

    component.resetFilters();

    expect(component.filterForm.get('search')?.value).toBe('');
    expect(component.filterForm.get('type')?.value).toBe('');
    expect(component.filterForm.get('status')?.value).toBe('');
    expect(component.filterForm.get('state')?.value).toBe('');
    expect(component.filteredFacilities.length).toBe(component.facilities.length);
  });

  it('should handle page event', () => {
    const pageEvent: PageEvent = {
      pageIndex: 1,
      pageSize: 10,
      length: 50
    };

    component.handlePageEvent(pageEvent);

    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(10);
  });

  it('should get paginated facilities', () => {
    component.pageSize = 10;
    component.pageIndex = 0;
    const paginated = component.getPaginatedFacilities();
    expect(paginated.length).toBe(10);
  });

  it('should get second page of facilities', () => {
    component.pageSize = 10;
    component.pageIndex = 1;
    const paginated = component.getPaginatedFacilities();
    expect(paginated.length).toBe(10);
    expect(paginated[0]).toBe(component.filteredFacilities[10]);
  });

  it('should open create form', () => {
    component.openCreateForm();
    expect(component.showForm).toBeTrue();
    expect(component.isEditMode).toBeFalse();
    expect(component.selectedFacility).toBeNull();
    expect(component.facilityForm.get('code')?.disabled).toBeFalse();
  });

  it('should open edit form', () => {
    const facility = component.facilities[0];
    component.openEditForm(facility);
    expect(component.showForm).toBeTrue();
    expect(component.isEditMode).toBeTrue();
    expect(component.selectedFacility).toBe(facility);
    expect(component.facilityForm.get('name')?.value).toBe(facility.name);
    expect(component.facilityForm.get('code')?.disabled).toBeTrue();
  });

  it('should populate form when editing', () => {
    const facility = component.facilities[0];
    component.openEditForm(facility);

    expect(component.facilityForm.get('name')?.value).toBe(facility.name);
    expect(component.facilityForm.get('code')?.value).toBe(facility.code);
    expect(component.facilityForm.get('type')?.value).toBe(facility.type);
    expect(component.facilityForm.get('status')?.value).toBe(facility.status);
    expect(component.facilityForm.get('address')?.value).toBe(facility.address);
    expect(component.facilityForm.get('city')?.value).toBe(facility.city);
    expect(component.facilityForm.get('state')?.value).toBe(facility.state);
    expect(component.facilityForm.get('zipCode')?.value).toBe(facility.zipCode);
    expect(component.facilityForm.get('phone')?.value).toBe(facility.phone);
    expect(component.facilityForm.get('email')?.value).toBe(facility.email);
    expect(component.facilityForm.get('managerName')?.value).toBe(facility.managerName);
    expect(component.facilityForm.get('managerEmail')?.value).toBe(facility.managerEmail);
    expect(component.facilityForm.get('capacity')?.value).toBe(facility.capacity);
    expect(component.facilityForm.get('storageType')?.value).toBe(facility.storageType);
    expect(component.facilityForm.get('license')?.value).toBe(facility.license);
    expect(component.facilityForm.get('certifications')?.value).toBe(facility.certifications.join(', '));
  });

  it('should close form', () => {
    component.showForm = true;
    component.closeForm();
    expect(component.showForm).toBeFalse();
    expect(component.facilityForm.pristine).toBeTrue();
  });

  it('should save new facility', () => {
    component.openCreateForm();
    component.facilityForm.patchValue({
      name: 'Test Hospital',
      code: 'TH000001',
      type: 'Hospital',
      status: 'Active',
      address: '123 Test St',
      city: 'Test City',
      state: 'California',
      zipCode: '12345',
      phone: '+1-555-0100',
      email: 'test@hospital.com',
      managerName: 'Test Manager',
      managerEmail: 'manager@hospital.com',
      capacity: 1000,
      storageType: 'Cold Chain',
      license: 'LIC-12345',
      certifications: 'ISO 9001, WHO GMP'
    });

    const initialLength = component.facilities.length;
    component.saveFacility();

    expect(component.facilities.length).toBe(initialLength + 1);
    expect(component.showForm).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledWith('Facility created successfully');
  });

  it('should update existing facility', () => {
    const facility = component.facilities[0];
    component.openEditForm(facility);
    
    const newName = 'Updated Hospital Name';
    component.facilityForm.get('name')?.setValue(newName);
    component.saveFacility();

    const updated = component.facilities.find(f => f.id === facility.id);
    expect(updated?.name).toBe(newName);
    expect(component.showForm).toBeFalse();
    expect(notificationService.success).toHaveBeenCalledWith('Facility updated successfully');
  });

  it('should parse certifications from comma-separated string', () => {
    component.openCreateForm();
    component.facilityForm.patchValue({
      name: 'Test',
      code: 'TC000001',
      type: 'Hospital',
      status: 'Active',
      address: '123 Test',
      city: 'Test',
      state: 'California',
      zipCode: '12345',
      phone: '+1-555-0100',
      email: 'test@test.com',
      managerName: 'Test',
      managerEmail: 'test@test.com',
      capacity: 1000,
      storageType: 'Cold Chain',
      license: 'LIC-123',
      certifications: 'ISO 9001, WHO GMP, FDA Approved'
    });

    component.saveFacility();
    const newFacility = component.facilities[component.facilities.length - 1];
    expect(newFacility.certifications.length).toBe(3);
    expect(newFacility.certifications).toContain('ISO 9001');
    expect(newFacility.certifications).toContain('WHO GMP');
    expect(newFacility.certifications).toContain('FDA Approved');
  });

  it('should not save if form is invalid', () => {
    component.openCreateForm();
    component.facilityForm.patchValue({
      name: '',
      code: '',
      type: '',
      status: ''
    });

    const initialLength = component.facilities.length;
    component.saveFacility();

    expect(component.facilities.length).toBe(initialLength);
    expect(component.facilityForm.touched).toBeTrue();
  });

  it('should validate required fields', () => {
    component.openCreateForm();
    const form = component.facilityForm;

    form.get('name')?.setValue('');
    expect(form.get('name')?.hasError('required')).toBeTrue();

    form.get('code')?.setValue('');
    expect(form.get('code')?.hasError('required')).toBeTrue();

    form.get('type')?.setValue('');
    expect(form.get('type')?.hasError('required')).toBeTrue();

    form.get('status')?.setValue('');
    expect(form.get('status')?.hasError('required')).toBeTrue();
  });

  it('should validate name min length', () => {
    component.facilityForm.get('name')?.setValue('AB');
    expect(component.facilityForm.get('name')?.hasError('minlength')).toBeTrue();

    component.facilityForm.get('name')?.setValue('ABC');
    expect(component.facilityForm.get('name')?.hasError('minlength')).toBeFalse();
  });

  it('should validate code pattern', () => {
    component.facilityForm.get('code')?.setValue('invalid');
    expect(component.facilityForm.get('code')?.hasError('pattern')).toBeTrue();

    component.facilityForm.get('code')?.setValue('ABC123');
    expect(component.facilityForm.get('code')?.hasError('pattern')).toBeFalse();

    component.facilityForm.get('code')?.setValue('FC000001');
    expect(component.facilityForm.get('code')?.hasError('pattern')).toBeFalse();
  });

  it('should validate email format', () => {
    component.facilityForm.get('email')?.setValue('invalid-email');
    expect(component.facilityForm.get('email')?.hasError('email')).toBeTrue();

    component.facilityForm.get('email')?.setValue('valid@email.com');
    expect(component.facilityForm.get('email')?.hasError('email')).toBeFalse();
  });

  it('should validate manager email format', () => {
    component.facilityForm.get('managerEmail')?.setValue('invalid');
    expect(component.facilityForm.get('managerEmail')?.hasError('email')).toBeTrue();

    component.facilityForm.get('managerEmail')?.setValue('manager@test.com');
    expect(component.facilityForm.get('managerEmail')?.hasError('email')).toBeFalse();
  });

  it('should validate zip code pattern', () => {
    component.facilityForm.get('zipCode')?.setValue('1234');
    expect(component.facilityForm.get('zipCode')?.hasError('pattern')).toBeTrue();

    component.facilityForm.get('zipCode')?.setValue('12345');
    expect(component.facilityForm.get('zipCode')?.hasError('pattern')).toBeFalse();

    component.facilityForm.get('zipCode')?.setValue('12345-6789');
    expect(component.facilityForm.get('zipCode')?.hasError('pattern')).toBeFalse();
  });

  it('should validate phone pattern', () => {
    component.facilityForm.get('phone')?.setValue('abc');
    expect(component.facilityForm.get('phone')?.hasError('pattern')).toBeTrue();

    component.facilityForm.get('phone')?.setValue('+1-555-0100');
    expect(component.facilityForm.get('phone')?.hasError('pattern')).toBeFalse();

    component.facilityForm.get('phone')?.setValue('(555) 123-4567');
    expect(component.facilityForm.get('phone')?.hasError('pattern')).toBeFalse();
  });

  it('should validate capacity minimum', () => {
    component.facilityForm.get('capacity')?.setValue(0);
    expect(component.facilityForm.get('capacity')?.hasError('min')).toBeTrue();

    component.facilityForm.get('capacity')?.setValue(1);
    expect(component.facilityForm.get('capacity')?.hasError('min')).toBeFalse();

    component.facilityForm.get('capacity')?.setValue(1000);
    expect(component.facilityForm.get('capacity')?.hasError('min')).toBeFalse();
  });

  it('should view facility details', () => {
    const facility = component.facilities[0];
    component.viewDetails(facility);
    expect(component.showDetailDialog).toBeTrue();
    expect(component.detailFacility).toBe(facility);
  });

  it('should close detail dialog', () => {
    component.showDetailDialog = true;
    component.detailFacility = component.facilities[0];
    component.closeDetailDialog();
    expect(component.showDetailDialog).toBeFalse();
    expect(component.detailFacility).toBeNull();
  });

  it('should update facility status', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const facility = component.facilities[0];
    const originalStatus = facility.status;
    const newStatus = originalStatus === 'Active' ? 'Inactive' : 'Active';

    component.updateStatus(facility, newStatus);

    expect(facility.status).toBe(newStatus);
    expect(notificationService.success).toHaveBeenCalledWith(`Facility status updated to ${newStatus}`);
  });

  it('should not update status if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const facility = component.facilities[0];
    const originalStatus = facility.status;

    component.updateStatus(facility, 'Inactive');

    expect(facility.status).toBe(originalStatus);
    expect(notificationService.success).not.toHaveBeenCalled();
  });

  it('should delete facility', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const facility = component.facilities[0];
    const initialLength = component.facilities.length;

    component.deleteFacility(facility);

    expect(component.facilities.length).toBe(initialLength - 1);
    expect(component.facilities.find(f => f.id === facility.id)).toBeUndefined();
    expect(notificationService.success).toHaveBeenCalledWith('Facility deleted successfully');
  });

  it('should not delete facility if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const facility = component.facilities[0];
    const initialLength = component.facilities.length;

    component.deleteFacility(facility);

    expect(component.facilities.length).toBe(initialLength);
    expect(notificationService.success).not.toHaveBeenCalled();
  });

  it('should export facilities as CSV', () => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window.URL, 'revokeObjectURL');
    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');

    component.exportFacilities('csv');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(link.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Facilities exported as CSV successfully');
  });

  it('should export facilities as JSON', () => {
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(window.URL, 'revokeObjectURL');
    const link = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(link);
    spyOn(link, 'click');

    component.exportFacilities('json');

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(link.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    expect(notificationService.success).toHaveBeenCalledWith('Facilities exported as JSON successfully');
  });

  it('should show coming soon message for PDF export', () => {
    component.exportFacilities('pdf');
    expect(notificationService.info).toHaveBeenCalledWith('PDF export coming soon');
  });

  it('should get correct status color', () => {
    expect(component.getStatusColor('Active')).toBe('#4caf50');
    expect(component.getStatusColor('Inactive')).toBe('#9e9e9e');
    expect(component.getStatusColor('Pending')).toBe('#ff9800');
    expect(component.getStatusColor('Suspended')).toBe('#f44336');
  });

  it('should get correct utilization color', () => {
    const facility = component.facilities[0];
    
    facility.currentStock = facility.capacity * 0.5;
    expect(component.getUtilizationColor(facility)).toBe('#4caf50');

    facility.currentStock = facility.capacity * 0.75;
    expect(component.getUtilizationColor(facility)).toBe('#ff9800');

    facility.currentStock = facility.capacity * 0.95;
    expect(component.getUtilizationColor(facility)).toBe('#f44336');
  });

  it('should format date correctly', () => {
    const dateString = '2024-01-15';
    const formatted = component.formatDate(dateString);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe('string');
  });

  it('should get field error for required', () => {
    const control = component.facilityForm.get('name');
    control?.setValue('');
    control?.markAsTouched();
    expect(component.getFieldError('name')).toBe('Facility name is required');
  });

  it('should get field error for email', () => {
    const control = component.facilityForm.get('email');
    control?.setValue('invalid');
    control?.markAsTouched();
    expect(component.getFieldError('email')).toBe('Email must be valid');
  });

  it('should get field error for minlength', () => {
    const control = component.facilityForm.get('name');
    control?.setValue('AB');
    control?.markAsTouched();
    expect(component.getFieldError('name')).toContain('at least');
  });

  it('should get field error for pattern', () => {
    const control = component.facilityForm.get('code');
    control?.setValue('invalid');
    control?.markAsTouched();
    expect(component.getFieldError('code')).toContain('format');
  });

  it('should get field error for min', () => {
    const control = component.facilityForm.get('capacity');
    control?.setValue(0);
    control?.markAsTouched();
    expect(component.getFieldError('capacity')).toContain('at least');
  });

  it('should get field label', () => {
    expect(component.getFieldLabel('name')).toBe('Facility Name');
    expect(component.getFieldLabel('code')).toBe('Facility Code');
    expect(component.getFieldLabel('type')).toBe('Facility Type');
    expect(component.getFieldLabel('managerEmail')).toBe('Manager Email');
    expect(component.getFieldLabel('storageType')).toBe('Storage Type');
  });

  it('should recalculate stats after adding facility', () => {
    const initialActive = component.stats.active;
    
    component.openCreateForm();
    component.facilityForm.patchValue({
      name: 'New Hospital',
      code: 'NH000001',
      type: 'Hospital',
      status: 'Active',
      address: '123 New St',
      city: 'New City',
      state: 'California',
      zipCode: '12345',
      phone: '+1-555-0100',
      email: 'new@hospital.com',
      managerName: 'New Manager',
      managerEmail: 'manager@new.com',
      capacity: 1000,
      storageType: 'Cold Chain',
      license: 'LIC-NEW',
      certifications: 'ISO 9001'
    });

    component.saveFacility();

    expect(component.stats.active).toBe(initialActive + 1);
    expect(component.stats.total).toBe(component.facilities.length);
  });

  it('should update stats when deleting facility', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const initialTotal = component.stats.total;
    const facility = component.facilities[0];

    component.deleteFacility(facility);

    expect(component.stats.total).toBe(initialTotal - 1);
  });

  it('should have all required form fields', () => {
    const expectedFields = [
      'name', 'code', 'type', 'status', 'address', 'city', 'state',
      'zipCode', 'phone', 'email', 'managerName', 'managerEmail',
      'capacity', 'storageType', 'license', 'certifications'
    ];

    expectedFields.forEach(field => {
      expect(component.facilityForm.get(field)).toBeDefined();
    });
  });

  it('should have all facility types defined', () => {
    expect(component.facilityTypes.length).toBeGreaterThan(0);
    expect(component.facilityTypes).toContain('Hospital');
    expect(component.facilityTypes).toContain('Clinic');
    expect(component.facilityTypes).toContain('Pharmacy');
  });

  it('should have all status options defined', () => {
    expect(component.statusOptions.length).toBe(4);
    expect(component.statusOptions).toContain('Active');
    expect(component.statusOptions).toContain('Inactive');
    expect(component.statusOptions).toContain('Pending');
    expect(component.statusOptions).toContain('Suspended');
  });

  it('should have all storage types defined', () => {
    expect(component.storageTypes.length).toBe(3);
    expect(component.storageTypes).toContain('Cold Chain');
    expect(component.storageTypes).toContain('Standard');
    expect(component.storageTypes).toContain('Mixed');
  });

  it('should have correct table columns', () => {
    expect(component.displayedColumns.length).toBe(8);
    expect(component.displayedColumns).toContain('code');
    expect(component.displayedColumns).toContain('name');
    expect(component.displayedColumns).toContain('type');
    expect(component.displayedColumns).toContain('location');
    expect(component.displayedColumns).toContain('manager');
    expect(component.displayedColumns).toContain('capacity');
    expect(component.displayedColumns).toContain('status');
    expect(component.displayedColumns).toContain('actions');
  });
});
