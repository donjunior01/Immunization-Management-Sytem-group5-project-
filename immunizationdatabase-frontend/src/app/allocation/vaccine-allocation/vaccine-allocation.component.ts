import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';

interface VaccineAllocation {
  id: number;
  allocationNumber: string;
  vaccineName: string;
  batchNumber: string;
  manufacturer: string;
  quantity: number;
  sourceFacility: string;
  destinationFacility: string;
  allocationDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  transportMethod: string;
  trackingNumber?: string;
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  temperature?: number;
  storageConditions: string;
}

interface AllocationStats {
  totalAllocations: number;
  pending: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  totalQuantity: number;
  avgDeliveryTime: number;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  currentStock: number;
  capacity: number;
}

@Component({
  selector: 'app-vaccine-allocation',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatStepperModule
  ],
  templateUrl: './vaccine-allocation.component.html',
  styleUrl: './vaccine-allocation.component.scss'
})
export class VaccineAllocationComponent implements OnInit {
  allocations: VaccineAllocation[] = [];
  filteredAllocations: VaccineAllocation[] = [];
  facilities: Facility[] = [];
  stats: AllocationStats = {
    totalAllocations: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
    totalQuantity: 0,
    avgDeliveryTime: 0
  };

  filterForm: FormGroup;
  allocationForm: FormGroup;
  trackingForm: FormGroup;

  displayedColumns = ['allocationNumber', 'vaccine', 'quantity', 'route', 'dates', 'priority', 'status', 'actions'];

  vaccineTypes = ['BCG', 'OPV', 'DTP', 'Measles', 'Hepatitis B', 'Polio', 'Rotavirus', 'Pneumococcal', 'HPV', 'Yellow Fever'];
  statusOptions = ['Pending', 'In Transit', 'Delivered', 'Cancelled', 'Delayed'];
  priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  transportMethods = ['Refrigerated Truck', 'Air Freight', 'Standard Delivery', 'Express Courier', 'Cold Chain Vehicle'];
  storageConditions = ['2-8°C (Cold Chain)', '-20°C (Frozen)', '15-25°C (Room Temperature)', 'Ultra-Cold (-70°C)'];

  showForm = false;
  showTrackingDialog = false;
  showDetailDialog = false;
  isEditMode = false;
  selectedAllocation: VaccineAllocation | null = null;
  detailAllocation: VaccineAllocation | null = null;
  currentStep = 0;

  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      vaccine: [''],
      status: [''],
      priority: [''],
      sourceFacility: [''],
      destinationFacility: [''],
      dateFrom: [''],
      dateTo: ['']
    });

    this.allocationForm = this.fb.group({
      vaccineName: ['', Validators.required],
      batchNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      manufacturer: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      sourceFacility: ['', Validators.required],
      destinationFacility: ['', Validators.required],
      allocationDate: [new Date(), Validators.required],
      expectedDelivery: ['', Validators.required],
      priority: ['Medium', Validators.required],
      transportMethod: ['', Validators.required],
      storageConditions: ['', Validators.required],
      temperature: [''],
      requestedBy: [''],
      notes: ['']
    });

    this.trackingForm = this.fb.group({
      trackingNumber: ['', Validators.required],
      status: ['', Validators.required],
      actualDelivery: [''],
      temperature: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loaderService.show();
    this.generateMockData();
    this.calculateStats();
    this.applyFilters();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  generateMockData(): void {
    const vaccines = this.vaccineTypes;
    const statuses: VaccineAllocation['status'][] = ['Pending', 'In Transit', 'Delivered', 'Cancelled', 'Delayed'];
    const priorities: VaccineAllocation['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
    const manufacturers = ['Serum Institute', 'Pfizer', 'Moderna', 'AstraZeneca', 'Johnson & Johnson', 'Bharat Biotech'];
    const facilityNames = ['City Hospital', 'County Clinic', 'Regional Medical Center', 'Community Health Center', 
                          'District Hospital', 'Primary Care Facility', 'Metropolitan Hospital', 'Rural Health Post'];
    const requesters = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis', 'Dr. Miller'];

    // Generate facilities
    for (let i = 0; i < 15; i++) {
      this.facilities.push({
        id: `FAC${String(i + 1).padStart(3, '0')}`,
        name: facilityNames[i % facilityNames.length] + ' ' + (Math.floor(i / facilityNames.length) + 1),
        type: i % 3 === 0 ? 'Hospital' : i % 3 === 1 ? 'Clinic' : 'Health Center',
        currentStock: Math.floor(Math.random() * 5000) + 1000,
        capacity: Math.floor(Math.random() * 3000) + 7000
      });
    }

    // Generate allocations
    for (let i = 0; i < 50; i++) {
      const allocationDate = new Date();
      allocationDate.setDate(allocationDate.getDate() - Math.floor(Math.random() * 60));
      
      const expectedDelivery = new Date(allocationDate);
      expectedDelivery.setDate(expectedDelivery.getDate() + Math.floor(Math.random() * 7) + 1);

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const actualDelivery = status === 'Delivered' ? new Date(expectedDelivery) : undefined;
      if (actualDelivery) {
        actualDelivery.setDate(actualDelivery.getDate() + Math.floor(Math.random() * 3) - 1);
      }

      const sourceFacility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      let destinationFacility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      while (destinationFacility.id === sourceFacility.id) {
        destinationFacility = this.facilities[Math.floor(Math.random() * this.facilities.length)];
      }

      this.allocations.push({
        id: i + 1,
        allocationNumber: `AL${new Date().getFullYear()}${String(i + 1).padStart(5, '0')}`,
        vaccineName: vaccines[Math.floor(Math.random() * vaccines.length)],
        batchNumber: `BATCH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        manufacturer: manufacturers[Math.floor(Math.random() * manufacturers.length)],
        quantity: Math.floor(Math.random() * 5000) + 100,
        sourceFacility: sourceFacility.name,
        destinationFacility: destinationFacility.name,
        allocationDate: allocationDate.toISOString().split('T')[0],
        expectedDelivery: expectedDelivery.toISOString().split('T')[0],
        actualDelivery: actualDelivery?.toISOString().split('T')[0],
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        transportMethod: this.transportMethods[Math.floor(Math.random() * this.transportMethods.length)],
        trackingNumber: status !== 'Pending' ? `TRK${Math.random().toString(36).substring(2, 12).toUpperCase()}` : undefined,
        requestedBy: requesters[Math.floor(Math.random() * requesters.length)],
        approvedBy: status !== 'Pending' ? requesters[Math.floor(Math.random() * requesters.length)] : undefined,
        notes: i % 3 === 0 ? 'Urgent delivery required for campaign' : undefined,
        temperature: status === 'In Transit' || status === 'Delivered' ? Math.floor(Math.random() * 6) + 2 : undefined,
        storageConditions: this.storageConditions[Math.floor(Math.random() * this.storageConditions.length)]
      });
    }
  }

  calculateStats(): void {
    this.stats.totalAllocations = this.allocations.length;
    this.stats.pending = this.allocations.filter(a => a.status === 'Pending').length;
    this.stats.inTransit = this.allocations.filter(a => a.status === 'In Transit').length;
    this.stats.delivered = this.allocations.filter(a => a.status === 'Delivered').length;
    this.stats.cancelled = this.allocations.filter(a => a.status === 'Cancelled').length;
    this.stats.totalQuantity = this.allocations.reduce((sum, a) => sum + a.quantity, 0);

    const delivered = this.allocations.filter(a => a.status === 'Delivered' && a.actualDelivery && a.allocationDate);
    if (delivered.length > 0) {
      const totalDays = delivered.reduce((sum, a) => {
        const allocation = new Date(a.allocationDate);
        const delivery = new Date(a.actualDelivery!);
        return sum + Math.floor((delivery.getTime() - allocation.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      this.stats.avgDeliveryTime = Math.round(totalDays / delivered.length);
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    this.filteredAllocations = this.allocations.filter(allocation => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        allocation.allocationNumber.toLowerCase().includes(searchLower) ||
        allocation.vaccineName.toLowerCase().includes(searchLower) ||
        allocation.batchNumber.toLowerCase().includes(searchLower) ||
        allocation.sourceFacility.toLowerCase().includes(searchLower) ||
        allocation.destinationFacility.toLowerCase().includes(searchLower);

      const matchesVaccine = !filters.vaccine || allocation.vaccineName === filters.vaccine;
      const matchesStatus = !filters.status || allocation.status === filters.status;
      const matchesPriority = !filters.priority || allocation.priority === filters.priority;
      const matchesSource = !filters.sourceFacility || allocation.sourceFacility === filters.sourceFacility;
      const matchesDestination = !filters.destinationFacility || allocation.destinationFacility === filters.destinationFacility;

      let matchesDateFrom = true;
      let matchesDateTo = true;
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        const allocationDate = new Date(allocation.allocationDate);
        matchesDateFrom = allocationDate >= dateFrom;
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        const allocationDate = new Date(allocation.allocationDate);
        matchesDateTo = allocationDate <= dateTo;
      }

      return matchesSearch && matchesVaccine && matchesStatus && matchesPriority && 
             matchesSource && matchesDestination && matchesDateFrom && matchesDateTo;
    });

    this.totalItems = this.filteredAllocations.length;
    this.pageIndex = 0;
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      vaccine: '',
      status: '',
      priority: '',
      sourceFacility: '',
      destinationFacility: '',
      dateFrom: '',
      dateTo: ''
    });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  getPaginatedAllocations(): VaccineAllocation[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredAllocations.slice(startIndex, startIndex + this.pageSize);
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.selectedAllocation = null;
    this.currentStep = 0;
    this.allocationForm.reset({
      priority: 'Medium',
      allocationDate: new Date(),
      requestedBy: 'Current User'
    });
    this.allocationForm.enable();
    this.showForm = true;
  }

  openEditForm(allocation: VaccineAllocation): void {
    this.isEditMode = true;
    this.selectedAllocation = allocation;
    this.currentStep = 0;
    this.allocationForm.patchValue({
      vaccineName: allocation.vaccineName,
      batchNumber: allocation.batchNumber,
      manufacturer: allocation.manufacturer,
      quantity: allocation.quantity,
      sourceFacility: allocation.sourceFacility,
      destinationFacility: allocation.destinationFacility,
      allocationDate: new Date(allocation.allocationDate),
      expectedDelivery: new Date(allocation.expectedDelivery),
      priority: allocation.priority,
      transportMethod: allocation.transportMethod,
      storageConditions: allocation.storageConditions,
      temperature: allocation.temperature,
      requestedBy: allocation.requestedBy,
      notes: allocation.notes
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.allocationForm.reset();
    this.currentStep = 0;
  }

  saveAllocation(): void {
    if (this.allocationForm.invalid) {
      Object.keys(this.allocationForm.controls).forEach(key => {
        this.allocationForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.allocationForm.value;
    
    if (this.isEditMode && this.selectedAllocation) {
      Object.assign(this.selectedAllocation, {
        vaccineName: formValue.vaccineName,
        batchNumber: formValue.batchNumber,
        manufacturer: formValue.manufacturer,
        quantity: formValue.quantity,
        sourceFacility: formValue.sourceFacility,
        destinationFacility: formValue.destinationFacility,
        allocationDate: formValue.allocationDate.toISOString().split('T')[0],
        expectedDelivery: formValue.expectedDelivery.toISOString().split('T')[0],
        priority: formValue.priority,
        transportMethod: formValue.transportMethod,
        storageConditions: formValue.storageConditions,
        temperature: formValue.temperature,
        requestedBy: formValue.requestedBy,
        notes: formValue.notes
      });
      this.notificationService.success('Allocation updated successfully');
    } else {
      const newAllocation: VaccineAllocation = {
        id: this.allocations.length + 1,
        allocationNumber: `AL${new Date().getFullYear()}${String(this.allocations.length + 1).padStart(5, '0')}`,
        vaccineName: formValue.vaccineName,
        batchNumber: formValue.batchNumber,
        manufacturer: formValue.manufacturer,
        quantity: formValue.quantity,
        sourceFacility: formValue.sourceFacility,
        destinationFacility: formValue.destinationFacility,
        allocationDate: formValue.allocationDate.toISOString().split('T')[0],
        expectedDelivery: formValue.expectedDelivery.toISOString().split('T')[0],
        status: 'Pending',
        priority: formValue.priority,
        transportMethod: formValue.transportMethod,
        storageConditions: formValue.storageConditions,
        temperature: formValue.temperature,
        requestedBy: formValue.requestedBy || 'Current User',
        notes: formValue.notes
      };

      this.allocations.unshift(newAllocation);
      this.notificationService.success('Allocation created successfully');
    }

    this.calculateStats();
    this.applyFilters();
    this.closeForm();
  }

  viewDetails(allocation: VaccineAllocation): void {
    this.detailAllocation = allocation;
    this.showDetailDialog = true;
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.detailAllocation = null;
  }

  openTrackingDialog(allocation: VaccineAllocation): void {
    this.selectedAllocation = allocation;
    this.trackingForm.patchValue({
      trackingNumber: allocation.trackingNumber || '',
      status: allocation.status,
      actualDelivery: allocation.actualDelivery ? new Date(allocation.actualDelivery) : null,
      temperature: allocation.temperature || '',
      notes: allocation.notes || ''
    });
    this.showTrackingDialog = true;
  }

  closeTrackingDialog(): void {
    this.showTrackingDialog = false;
    this.trackingForm.reset();
    this.selectedAllocation = null;
  }

  updateTracking(): void {
    if (this.trackingForm.invalid || !this.selectedAllocation) {
      Object.keys(this.trackingForm.controls).forEach(key => {
        this.trackingForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.trackingForm.value;
    Object.assign(this.selectedAllocation, {
      trackingNumber: formValue.trackingNumber,
      status: formValue.status,
      actualDelivery: formValue.actualDelivery ? formValue.actualDelivery.toISOString().split('T')[0] : undefined,
      temperature: formValue.temperature,
      notes: formValue.notes
    });

    this.calculateStats();
    this.applyFilters();
    this.notificationService.success('Tracking information updated successfully');
    this.closeTrackingDialog();
  }

  approveAllocation(allocation: VaccineAllocation): void {
    if (confirm(`Approve allocation ${allocation.allocationNumber}?`)) {
      allocation.status = 'In Transit';
      allocation.approvedBy = 'Current User';
      allocation.trackingNumber = `TRK${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      this.calculateStats();
      this.applyFilters();
      this.notificationService.success('Allocation approved and in transit');
    }
  }

  cancelAllocation(allocation: VaccineAllocation): void {
    if (confirm(`Cancel allocation ${allocation.allocationNumber}? This action cannot be undone.`)) {
      allocation.status = 'Cancelled';
      this.calculateStats();
      this.applyFilters();
      this.notificationService.success('Allocation cancelled');
    }
  }

  deleteAllocation(allocation: VaccineAllocation): void {
    if (confirm(`Delete allocation ${allocation.allocationNumber}? This action cannot be undone.`)) {
      const index = this.allocations.findIndex(a => a.id === allocation.id);
      if (index > -1) {
        this.allocations.splice(index, 1);
        this.calculateStats();
        this.applyFilters();
        this.notificationService.success('Allocation deleted successfully');
      }
    }
  }

  exportAllocations(format: 'csv' | 'json' | 'pdf'): void {
    if (format === 'csv') {
      const headers = ['Allocation Number', 'Vaccine', 'Batch', 'Quantity', 'Source', 'Destination', 'Date', 'Expected Delivery', 'Status', 'Priority'];
      const rows = this.filteredAllocations.map(a => [
        a.allocationNumber,
        a.vaccineName,
        a.batchNumber,
        a.quantity,
        a.sourceFacility,
        a.destinationFacility,
        a.allocationDate,
        a.expectedDelivery,
        a.status,
        a.priority
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vaccine-allocations-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.notificationService.success('Allocations exported as CSV successfully');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(this.filteredAllocations, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vaccine-allocations-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.notificationService.success('Allocations exported as JSON successfully');
    } else {
      this.notificationService.info('PDF export coming soon');
    }
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Pending': '#ff9800',
      'In Transit': '#2196f3',
      'Delivered': '#4caf50',
      'Cancelled': '#f44336',
      'Delayed': '#ff5722'
    };
    return colors[status] || '#9e9e9e';
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      'Low': '#4caf50',
      'Medium': '#ff9800',
      'High': '#ff5722',
      'Urgent': '#f44336'
    };
    return colors[priority] || '#9e9e9e';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getFieldError(fieldName: string): string {
    const control = this.allocationForm.get(fieldName) || this.trackingForm.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (control.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['min'].min}`;
    if (control.errors['pattern']) return `${this.getFieldLabel(fieldName)} format is invalid`;
    
    return 'Invalid field';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      vaccineName: 'Vaccine Name',
      batchNumber: 'Batch Number',
      manufacturer: 'Manufacturer',
      quantity: 'Quantity',
      sourceFacility: 'Source Facility',
      destinationFacility: 'Destination Facility',
      allocationDate: 'Allocation Date',
      expectedDelivery: 'Expected Delivery',
      priority: 'Priority',
      transportMethod: 'Transport Method',
      storageConditions: 'Storage Conditions',
      temperature: 'Temperature',
      trackingNumber: 'Tracking Number',
      status: 'Status',
      actualDelivery: 'Actual Delivery',
      requestedBy: 'Requested By',
      notes: 'Notes'
    };
    return labels[fieldName] || fieldName;
  }

  getUniqueFacilities(): string[] {
    const facilities = new Set<string>();
    this.allocations.forEach(a => {
      facilities.add(a.sourceFacility);
      facilities.add(a.destinationFacility);
    });
    return Array.from(facilities).sort();
  }
}
