import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface Facility {
  id: string;
  name: string;
  code: string;
  type: 'Hospital' | 'Clinic' | 'Health Center' | 'Pharmacy' | 'Warehouse' | 'Distribution Center';
  status: 'Active' | 'Inactive' | 'Pending' | 'Suspended';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  managerName: string;
  managerEmail: string;
  capacity: number;
  currentStock: number;
  storageType: 'Cold Chain' | 'Standard' | 'Mixed';
  license: string;
  certifications: string[];
  establishedDate: string;
  lastInspection: string;
  nextInspection: string;
  coordinates?: { lat: number; lng: number };
}

interface FacilityStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  totalCapacity: number;
  utilizationRate: number;
}

@Component({
  selector: 'app-facility-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule
  ],
  templateUrl: './facility-management.component.html',
  styleUrls: ['./facility-management.component.scss']
})
export class FacilityManagementComponent implements OnInit {
  facilities: Facility[] = [];
  filteredFacilities: Facility[] = [];
  displayedColumns: string[] = ['code', 'name', 'type', 'location', 'manager', 'capacity', 'status', 'actions'];
  
  filterForm: FormGroup;
  facilityForm: FormGroup;
  
  stats: FacilityStats = {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    totalCapacity: 0,
    utilizationRate: 0
  };

  facilityTypes = ['Hospital', 'Clinic', 'Health Center', 'Pharmacy', 'Warehouse', 'Distribution Center'];
  statusOptions = ['Active', 'Inactive', 'Pending', 'Suspended'];
  storageTypes = ['Cold Chain', 'Standard', 'Mixed'];
  stateOptions = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];

  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  isEditMode = false;
  selectedFacility: Facility | null = null;
  showForm = false;
  showDetailDialog = false;
  detailFacility: Facility | null = null;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      state: ['']
    });

    this.facilityForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6,10}$/)]],
      type: ['', Validators.required],
      status: ['Active', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      managerName: ['', Validators.required],
      managerEmail: ['', [Validators.required, Validators.email]],
      capacity: [0, [Validators.required, Validators.min(1)]],
      storageType: ['', Validators.required],
      license: ['', Validators.required],
      certifications: ['']
    });
  }

  ngOnInit(): void {
    this.loadFacilities();
    this.setupFilterSubscription();
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadFacilities(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.facilities = this.generateMockFacilities();
      this.calculateStats();
      this.applyFilters();
      this.loaderService.show();
    }, 1000);
  }

  generateMockFacilities(): Facility[] {
    const facilities: Facility[] = [];
    const types: Array<Facility['type']> = ['Hospital', 'Clinic', 'Health Center', 'Pharmacy', 'Warehouse', 'Distribution Center'];
    const statuses: Array<Facility['status']> = ['Active', 'Inactive', 'Pending', 'Suspended'];
    const storageTypes: Array<Facility['storageType']> = ['Cold Chain', 'Standard', 'Mixed'];
    const cities = ['Los Angeles', 'Houston', 'Miami', 'New York', 'Philadelphia', 'Chicago', 'Columbus', 'Atlanta', 'Charlotte', 'Detroit'];

    for (let i = 1; i <= 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = i <= 35 ? 'Active' : statuses[Math.floor(Math.random() * statuses.length)];
      const state = this.stateOptions[i % this.stateOptions.length];
      const city = cities[i % cities.length];
      const capacity = Math.floor(Math.random() * 5000) + 500;
      const currentStock = Math.floor(capacity * (0.4 + Math.random() * 0.5));

      facilities.push({
        id: `FAC-${String(i).padStart(4, '0')}`,
        name: `${type} ${city}`,
        code: `FC${String(i).padStart(6, '0')}`,
        type,
        status,
        address: `${100 + i} ${['Main', 'Oak', 'Elm', 'Pine', 'Maple'][i % 5]} Street`,
        city,
        state,
        zipCode: `${10000 + i * 100}`,
        phone: `+1-555-${String(i).padStart(4, '0')}`,
        email: `manager${i}@facility.com`,
        managerName: `Manager ${String.fromCharCode(65 + (i % 26))}`,
        managerEmail: `manager${i}@facility.com`,
        capacity,
        currentStock,
        storageType: storageTypes[i % storageTypes.length],
        license: `LIC-${String(i).padStart(6, '0')}`,
        certifications: ['ISO 9001', 'WHO GMP', 'FDA Approved'].slice(0, Math.floor(Math.random() * 3) + 1),
        establishedDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        lastInspection: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        nextInspection: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        coordinates: { lat: 34.0522 + (Math.random() - 0.5) * 10, lng: -118.2437 + (Math.random() - 0.5) * 10 }
      });
    }

    return facilities;
  }

  calculateStats(): void {
    this.stats.total = this.facilities.length;
    this.stats.active = this.facilities.filter(f => f.status === 'Active').length;
    this.stats.inactive = this.facilities.filter(f => f.status === 'Inactive').length;
    this.stats.pending = this.facilities.filter(f => f.status === 'Pending').length;
    this.stats.totalCapacity = this.facilities.reduce((sum, f) => sum + f.capacity, 0);
    
    const totalStock = this.facilities.reduce((sum, f) => sum + f.currentStock, 0);
    this.stats.utilizationRate = this.stats.totalCapacity > 0 
      ? Math.round((totalStock / this.stats.totalCapacity) * 100) 
      : 0;
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    let filtered = [...this.facilities];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search) ||
        f.code.toLowerCase().includes(search) ||
        f.city.toLowerCase().includes(search) ||
        f.managerName.toLowerCase().includes(search)
      );
    }

    if (filters.type) {
      filtered = filtered.filter(f => f.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters.state) {
      filtered = filtered.filter(f => f.state === filters.state);
    }

    this.filteredFacilities = filtered;
    this.totalItems = filtered.length;
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.notificationService.info('Filters reset');
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedFacilities(): Facility[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredFacilities.slice(start, end);
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.selectedFacility = null;
    this.facilityForm.reset({ status: 'Active' });
    this.showForm = true;
  }

  openEditForm(facility: Facility): void {
    this.isEditMode = true;
    this.selectedFacility = facility;
    this.facilityForm.patchValue({
      ...facility,
      certifications: facility.certifications.join(', ')
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.selectedFacility = null;
    this.facilityForm.reset();
  }

  saveFacility(): void {
    if (this.facilityForm.invalid) {
      Object.keys(this.facilityForm.controls).forEach(key => {
        this.facilityForm.get(key)?.markAsTouched();
      });
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      const formValue = this.facilityForm.value;
      const certifications = formValue.certifications 
        ? formValue.certifications.split(',').map((c: string) => c.trim()).filter((c: string) => c)
        : [];

      if (this.isEditMode && this.selectedFacility) {
        const index = this.facilities.findIndex(f => f.id === this.selectedFacility!.id);
        if (index !== -1) {
          this.facilities[index] = {
            ...this.facilities[index],
            ...formValue,
            certifications
          };
          this.notificationService.success('Facility updated successfully');
        }
      } else {
        const newFacility: Facility = {
          id: `FAC-${String(this.facilities.length + 1).padStart(4, '0')}`,
          ...formValue,
          certifications,
          currentStock: 0,
          establishedDate: new Date().toISOString(),
          lastInspection: new Date().toISOString(),
          nextInspection: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        this.facilities.unshift(newFacility);
        this.notificationService.success('Facility created successfully');
      }

      this.calculateStats();
      this.applyFilters();
      this.closeForm();
    }, 1000);
  }

  viewDetails(facility: Facility): void {
    this.detailFacility = facility;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.detailFacility = null;
  }

  updateStatus(facility: Facility, newStatus: Facility['status']): void {
    this.loaderService.show();
    setTimeout(() => {
      const index = this.facilities.findIndex(f => f.id === facility.id);
      if (index !== -1) {
        this.facilities[index].status = newStatus;
        this.calculateStats();
        this.applyFilters();
        this.notificationService.success(`Facility status updated to ${newStatus}`);
      }
    }, 1000);
  }

  deleteFacility(facility: Facility): void {
    if (!confirm(`Are you sure you want to delete ${facility.name}?`)) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.facilities = this.facilities.filter(f => f.id !== facility.id);
      this.calculateStats();
      this.applyFilters();
      this.notificationService.success('Facility deleted successfully');
    }, 1000);
  }

  exportFacilities(format: 'csv' | 'json' | 'pdf'): void {
    this.loaderService.show();
    setTimeout(() => {
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'csv') {
        const headers = ['ID', 'Name', 'Code', 'Type', 'Status', 'City', 'State', 'Manager', 'Capacity', 'Current Stock', 'Storage Type'];
        const rows = this.filteredFacilities.map(f => [
          f.id, f.name, f.code, f.type, f.status, f.city, f.state, f.managerName, f.capacity, f.currentStock, f.storageType
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = `facilities_${new Date().getTime()}.csv`;
        mimeType = 'text/csv';
      } else if (format === 'json') {
        content = JSON.stringify(this.filteredFacilities, null, 2);
        filename = `facilities_${new Date().getTime()}.json`;
        mimeType = 'application/json';
      } else {
        // PDF export would use a library like jsPDF in production
        this.notificationService.info('PDF export functionality coming soon');
        return;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      this.notificationService.success(`Facilities exported as ${format.toUpperCase()}`);
    }, 1000);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Active': 'success',
      'Inactive': 'warn',
      'Pending': 'accent',
      'Suspended': 'error'
    };
    return colors[status] || 'primary';
  }

  getUtilizationColor(facility: Facility): string {
    const rate = (facility.currentStock / facility.capacity) * 100;
    if (rate < 40) return '#4caf50'; // Green
    if (rate < 70) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getFieldError(fieldName: string): string {
    const control = this.facilityForm.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (control.errors['email']) return 'Invalid email format';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['pattern']) {
      if (fieldName === 'phone') return 'Invalid phone number format';
      if (fieldName === 'zipCode') return 'Invalid ZIP code format (12345 or 12345-6789)';
      if (fieldName === 'code') return 'Code must be 6-10 alphanumeric characters (uppercase)';
    }

    return 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Facility name',
      code: 'Facility code',
      type: 'Facility type',
      status: 'Status',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP code',
      phone: 'Phone',
      email: 'Email',
      managerName: 'Manager name',
      managerEmail: 'Manager email',
      capacity: 'Capacity',
      storageType: 'Storage type',
      license: 'License number'
    };
    return labels[fieldName] || fieldName;
  }
}
