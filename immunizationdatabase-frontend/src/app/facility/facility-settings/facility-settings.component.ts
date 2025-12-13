import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface FacilityInfo {
  id: string;
  name: string;
  code: string;
  type: string;
  district: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  capacity: number;
  operatingHours: string;
  services: string[];
  status: string;
}

@Component({
  selector: 'app-facility-settings',
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
    MatSlideToggleModule,
    MatChipsModule
  ],
  templateUrl: './facility-settings.component.html',
  styleUrls: ['./facility-settings.component.scss']
})
export class FacilitySettingsComponent implements OnInit {
  facilityForm: FormGroup;
  operationalForm: FormGroup;
  contactForm: FormGroup;
  
  facility: FacilityInfo | null = null;
  isEditing = false;

  facilityTypes = [
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'HEALTH_CENTER', label: 'Health Center' },
    { value: 'CLINIC', label: 'Clinic' },
    { value: 'DISPENSARY', label: 'Dispensary' }
  ];

  services = [
    'Routine Immunization',
    'Outreach Services',
    'Cold Chain Management',
    'Vaccination Campaigns',
    'Antenatal Care',
    'Child Health Services',
    'Emergency Services'
  ];

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.facilityForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      type: ['', Validators.required],
      district: ['', Validators.required],
      region: ['', Validators.required],
      address: ['', Validators.required]
    });

    this.operationalForm = this.fb.group({
      capacity: [0, [Validators.required, Validators.min(1)]],
      operatingHours: ['', Validators.required],
      services: [[]]
    });

    this.contactForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadFacilityData();
  }

  loadFacilityData(): void {
    this.loaderService.show();
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      const facilityId = currentUser?.facilityId || 'FAC001';

      // Mock data - in production, this would be an API call
      this.facility = {
        id: facilityId,
        name: 'Central Health Facility',
        code: facilityId,
        type: 'HEALTH_CENTER',
        district: 'DIST001',
        region: 'Central Region',
        address: '123 Main Street, Nairobi',
        phone: '0712345678',
        email: 'central.facility@immunization.com',
        capacity: 500,
        operatingHours: 'Monday-Friday: 8:00 AM - 5:00 PM',
        services: ['Routine Immunization', 'Outreach Services', 'Cold Chain Management'],
        status: 'ACTIVE'
      };

      this.populateForms();
    }, 1000);
  }

  populateForms(): void {
    if (!this.facility) return;

    this.facilityForm.patchValue({
      name: this.facility.name,
      code: this.facility.code,
      type: this.facility.type,
      district: this.facility.district,
      region: this.facility.region,
      address: this.facility.address
    });

    this.operationalForm.patchValue({
      capacity: this.facility.capacity,
      operatingHours: this.facility.operatingHours,
      services: this.facility.services
    });

    this.contactForm.patchValue({
      phone: this.facility.phone,
      email: this.facility.email
    });

    this.disableForms();
  }

  disableForms(): void {
    this.facilityForm.disable();
    this.operationalForm.disable();
    this.contactForm.disable();
  }

  enableForms(): void {
    this.facilityForm.enable();
    this.operationalForm.enable();
    this.contactForm.enable();
    // Code and district should remain read-only
    this.facilityForm.get('code')?.disable();
  }

  startEditing(): void {
    this.isEditing = true;
    this.enableForms();
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateForms();
  }

  saveFacilityInfo(): void {
    if (this.facilityForm.invalid) {
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      // Update facility object
      if (this.facility) {
        this.facility = {
          ...this.facility,
          ...this.facilityForm.getRawValue()
        };
      }
      this.notificationService.success('Facility information updated successfully');
      this.isEditing = false;
      this.disableForms();
    }, 1000);
  }

  saveOperationalSettings(): void {
    if (this.operationalForm.invalid) {
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      if (this.facility) {
        this.facility = {
          ...this.facility,
          ...this.operationalForm.value
        };
      }
      this.notificationService.success('Operational settings updated successfully');
      this.isEditing = false;
      this.disableForms();
    }, 1000);
  }

  saveContactInfo(): void {
    if (this.contactForm.invalid) {
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      if (this.facility) {
        this.facility = {
          ...this.facility,
          ...this.contactForm.value
        };
      }
      this.notificationService.success('Contact information updated successfully');
      this.isEditing = false;
      this.disableForms();
    }, 1000);
  }

  toggleService(service: string): void {
    if (!this.isEditing) return;

    const currentServices = this.operationalForm.get('services')?.value || [];
    const index = currentServices.indexOf(service);

    if (index > -1) {
      currentServices.splice(index, 1);
    } else {
      currentServices.push(service);
    }

    this.operationalForm.patchValue({ services: currentServices });
  }

  isServiceSelected(service: string): boolean {
    const services = this.operationalForm.get('services')?.value || [];
    return services.includes(service);
  }

  getStatusColor(): string {
    return this.facility?.status === 'ACTIVE' ? 'success' : 'warn';
  }

  getStatusIcon(): string {
    return this.facility?.status === 'ACTIVE' ? 'check_circle' : 'error';
  }
}
