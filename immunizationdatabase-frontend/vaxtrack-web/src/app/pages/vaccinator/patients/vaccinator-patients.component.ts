import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { PatientService } from '../../../core/services/patient.service';
import { AuthService } from '../../../core/services/auth.service';
import { Patient, CreatePatientRequest, PatientSearchResponse } from '../../../core/models/patient.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { format, differenceInMonths } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-vaccinator-patients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './vaccinator-patients.component.html',
  styleUrl: './vaccinator-patients.component.scss'
})
export class VaccinatorPatientsComponent implements OnInit {
  patients: Patient[] = [];
  searchQuery = '';
  loading = false;
  showCreateForm = false;
  selectedPatient: Patient | null = null;
  errorMessage = '';
  successMessage = '';
  patientForm: FormGroup;

  private isLoadingData = false; // Prevent multiple simultaneous loads

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['MALE', [Validators.required]],
      guardianName: ['', [Validators.required]],
      guardianPhone: ['', [Validators.required, Validators.pattern(/^\+237\d{9}$/)]],
      nationalId: [''],
      village: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const user = this.authService?.getCurrentUser();
    const facilityId = user?.facilityId;
    
    this.patientService.searchPatients('', facilityId).subscribe({
      next: (response) => {
        this.patients = response.patients || [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.errorMessage = 'Failed to load patients';
        this.patients = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearch(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const user = this.authService?.getCurrentUser();
    const facilityId = user?.facilityId;
    
    if (this.searchQuery.trim()) {
      this.patientService.searchPatients(this.searchQuery, facilityId).subscribe({
        next: (response) => {
          this.patients = response.patients || [];
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
            this.isLoadingData = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.errorMessage = 'Failed to search patients';
          this.patients = [];
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
            this.isLoadingData = false;
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.loadPatients();
    }
  }

  openCreateForm(): void {
    this.patientForm.reset({
      gender: 'MALE'
    });
    this.showCreateForm = true;
    this.selectedPatient = null;
  }

  closeForm(): void {
    this.showCreateForm = false;
    this.selectedPatient = null;
    this.patientForm.reset();
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.loading = true;
      const startTime = Date.now();
      const patientData: CreatePatientRequest = this.patientForm.value;
      
      this.patientService.createPatient(patientData).subscribe({
        next: () => {
          this.successMessage = 'Patient registered successfully';
          this.closeForm();
          ensureMinimumLoadingTime(startTime, () => {
            this.loadPatients();
            this.loading = false;
          });
        },
        error: (error) => {
          this.errorMessage = 'Failed to register patient';
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
          });
        }
      });
    }
  }

  getPatientAge(birthDate?: string | null): number {
    if (!birthDate) return 0;
    return differenceInMonths(new Date(), new Date(birthDate));
  }

  viewPatient(patient: Patient): void {
    this.selectedPatient = patient;
  }
}

