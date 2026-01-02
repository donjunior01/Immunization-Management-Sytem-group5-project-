import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient, CreatePatientRequest } from '../../../core/models/patient.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-patients.component.html',
  styleUrl: './manager-patients.component.scss'
})
export class ManagerPatientsComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = false;
  errorMessage = '';
  searchQuery = '';
  filterGender = 'all';
  private isLoadingData = false;
  showCreateModal = false;
  patientForm: FormGroup;

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      guardianName: ['', [Validators.required]],
      guardianPhone: ['', [Validators.required, Validators.pattern(/^[26]\d{8}$/)]],
      address: [''],
      nationalId: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (!facilityId) {
      this.errorMessage = 'No facility ID available';
      this.loading = false;
      this.isLoadingData = false;
      return;
    }
    
    this.patientService.getPatientsByFacility(facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.applyFilters();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load patients:', error);
        this.errorMessage = 'Failed to load patients';
        this.patients = [];
        this.filteredPatients = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.patients];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.fullName?.toLowerCase().includes(query) ||
        p.firstName?.toLowerCase().includes(query) ||
        p.lastName?.toLowerCase().includes(query) ||
        p.phoneNumber?.includes(query) ||
        p.guardianPhone?.includes(query)
      );
    }
    
    if (this.filterGender !== 'all') {
      filtered = filtered.filter(p => p.gender === this.filterGender);
    }
    
    this.filteredPatients = filtered;
  }

  openCreateModal(): void {
    this.patientForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.patientForm.reset();
  }

  onCreateSubmit(): void {
    if (this.patientForm.valid) {
      this.loading = true;
      const facilityId = this.authService.getCurrentUser()?.facilityId;
      const formValue = this.patientForm.value;
      
      const patientRequest: CreatePatientRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        fullName: `${formValue.firstName} ${formValue.lastName}`,
        dateOfBirth: formValue.dateOfBirth,
        gender: formValue.gender,
        guardianName: formValue.guardianName,
        guardianPhone: `+237${formValue.guardianPhone}`,
        phoneNumber: `+237${formValue.guardianPhone}`,
        address: formValue.address || '',
        nationalId: formValue.nationalId || undefined,
        facilityId: facilityId
      };

      this.patientService.createPatient(patientRequest).subscribe({
        next: () => {
          this.loading = false;
          this.closeCreateModal();
          this.loadPatients();
        },
        error: (error) => {
          console.error('Failed to create patient:', error);
          this.errorMessage = 'Failed to register patient. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.patientForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['pattern']) return 'Invalid phone number format (must start with 6 or 2)';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
