import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { PatientService } from '../../../../core/services/patient.service';
import { CreatePatientRequest, Patient } from '../../../../core/models/patient.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ensureMinimumLoadingTime } from '../../../../core/utils/loading.util';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-patient',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './register-patient.component.html',
  styleUrl: './register-patient.component.scss'
})
export class RegisterPatientComponent implements OnInit {
  patientForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  showDuplicateModal = false;
  duplicatePatient: Patient | null = null;
  formDirty = false;
  showOfflineBanner = false;
  showSuccessModal = false;
  createdPatient: Patient | null = null;
  
  // Table and modal state
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  searchQuery = '';
  filterGender = 'all';
  showRegisterModal = false;
  private isLoadingData = false;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['MALE', [Validators.required]],
      nationalId: [''],
      village: [''],
      address: [''],
      guardianName: ['', [Validators.required]],
      guardianPhone: ['', [Validators.required, Validators.pattern(/^\+237[26]\d{8}$/)]],
      alternativePhone: [''],
      relationship: ['MOTHER', [Validators.required]]
    });

    // Track form changes
    this.patientForm.valueChanges.subscribe(() => {
      this.formDirty = true;
    });
  }

  ngOnInit(): void {
    this.checkOfflineStatus();
    this.loadPatients();
  }

  checkOfflineStatus(): void {
    if (typeof window !== 'undefined' && window.navigator) {
      this.showOfflineBanner = !window.navigator.onLine;
      window.addEventListener('online', () => this.showOfflineBanner = false);
      window.addEventListener('offline', () => this.showOfflineBanner = true);
    }
  }

  loadPatients(): void {
    if (this.isLoadingData) return;
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    let loadingCleared = false;
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
    
    // Safety timeout - ensure loader stops after 5 seconds max
    const timeoutId = setTimeout(() => {
      if (!loadingCleared) {
        console.warn('Patient list loading timeout - forcing completion');
        loadingCleared = true;
        this.loading = false;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    }, 5000);
    
    const clearLoading = () => {
      clearTimeout(timeoutId);
      if (!loadingCleared) {
        loadingCleared = true;
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
        // Fallback: ensure loading is cleared after max 500ms
        setTimeout(() => {
          if (this.loading) {
            this.loading = false;
            this.isLoadingData = false;
            this.cdr.detectChanges();
          }
        }, 500);
      }
    };
    
    if (!facilityId) {
      // Try global search or use empty list
      this.patientService.searchPatients('').subscribe({
        next: (response) => {
          this.patients = response.patients || [];
          this.applyFilters();
          clearLoading();
        },
        error: () => {
          this.patients = [];
          this.filteredPatients = [];
          clearLoading();
        }
      });
      return;
    }
    
    this.patientService.getPatientsByFacility(facilityId).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.applyFilters();
        clearLoading();
      },
      error: (error) => {
        console.warn('Failed to load patients:', error);
        this.patients = [];
        this.filteredPatients = [];
        clearLoading();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.patients];
    
    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.fullName || `${p.firstName || ''} ${p.lastName || ''}`).toLowerCase().includes(query) ||
        (p.guardianName || '').toLowerCase().includes(query) ||
        (p.phoneNumber || p.guardianPhone || '').includes(query) ||
        (p.patientId || p.id || '').toString().toLowerCase().includes(query)
      );
    }
    
    // Gender filter
    if (this.filterGender !== 'all') {
      filtered = filtered.filter(p => (p.gender || '').toUpperCase() === this.filterGender.toUpperCase());
    }
    
    this.filteredPatients = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openRegisterModal(): void {
    this.showRegisterModal = true;
    this.patientForm.reset({ gender: 'MALE', relationship: 'MOTHER' });
    this.formDirty = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeRegisterModal(): void {
    if (this.formDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        this.showRegisterModal = false;
        this.patientForm.reset({ gender: 'MALE', relationship: 'MOTHER' });
        this.formDirty = false;
      }
    } else {
      this.showRegisterModal = false;
      this.patientForm.reset({ gender: 'MALE', relationship: 'MOTHER' });
      this.formDirty = false;
    }
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      const startTime = Date.now();
      
      const user = this.authService.getCurrentUser();
      const token = this.authService.getToken();
      const formValue = this.patientForm.value;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register-patient.component.ts:196',message:'Creating patient - user info',data:{hasUser:!!user,userRole:user?.role,userFacilityId:user?.facilityId,hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AUTH_403'})}).catch(()=>{});
      // #endregion
      
      // Combine firstName and lastName into fullName for backend
      const fullName = `${formValue.firstName || ''} ${formValue.lastName || ''}`.trim();
      
      const patientData: CreatePatientRequest = {
        fullName: fullName,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        birthDate: formValue.birthDate,
        dateOfBirth: formValue.birthDate,
        gender: formValue.gender,
        guardianName: formValue.guardianName,
        guardianPhone: formValue.guardianPhone,
        phoneNumber: formValue.guardianPhone,
        nationalId: formValue.nationalId || undefined,
        village: formValue.village || formValue.address || undefined,
        address: formValue.address || formValue.village || undefined,
        facilityId: user?.facilityId
      };

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register-patient.component.ts:218',message:'Calling createPatient API',data:{patientData:JSON.stringify(patientData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AUTH_403'})}).catch(()=>{});
      // #endregion
      
      this.patientService.createPatient(patientData).subscribe({
        next: (response) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register-patient.component.ts:222',message:'Patient created successfully',data:{patientId:response?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AUTH_403'})}).catch(()=>{});
          // #endregion
          this.createdPatient = response;
          this.formDirty = false;
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
            // Close registration modal
            this.showRegisterModal = false;
            this.patientForm.reset({ gender: 'MALE', relationship: 'MOTHER' });
            // Show success modal
            this.showSuccessModal = true;
            // Reload patients list
            this.loadPatients();
          });
        },
        error: (error) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register-patient.component.ts:234',message:'Patient creation error',data:{status:error.status,statusText:error.statusText,errorMessage:error.error?.message,userRole:user?.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'AUTH_403'})}).catch(()=>{});
          // #endregion
          
          if (error.status === 409 || error.error?.message?.includes('duplicate') || error.error?.message?.includes('already exists')) {
            // Handle duplicate patient
            this.duplicatePatient = error.error?.duplicatePatient || null;
            this.showDuplicateModal = true;
          } else if (error.status === 400) {
            // Validation errors
            const validationErrors = error.error?.errors || {};
            const errorMessages = Object.values(validationErrors).flat() as string[];
            this.errorMessage = errorMessages.join(', ') || error.error?.message || 'Please check your input and try again.';
          } else if (error.status === 403) {
            this.errorMessage = 'You do not have permission to register patients.';
          } else {
            this.errorMessage = error.error?.message || 'Failed to register patient. Please try again.';
          }
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
          });
        }
      });
    } else {
      this.patientForm.markAllAsTouched();
    }
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  useDuplicatePatient(): void {
    if (this.duplicatePatient) {
      this.showDuplicateModal = false;
      this.router.navigate(['/vaccinator/patients', this.duplicatePatient.id]);
    }
  }

  registerNewAnyway(): void {
    this.showDuplicateModal = false;
    // Continue with registration - form is already filled, just submit
    if (this.patientForm.valid) {
      this.onSubmit();
    }
  }

  closeDuplicateModal(): void {
    this.showDuplicateModal = false;
  }

  getFieldError(fieldName: string): string {
    const field = this.patientForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return 'Invalid format. Use +237XXXXXXXXX';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.patientForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  formatPhoneNumber(event: any): void {
    const input = event.target;
    let value = input.value;
    
    // Remove all non-digit characters except +
    value = value.replace(/[^\d+]/g, '');
    
    // If doesn't start with +237, add it
    if (!value.startsWith('+237')) {
      // Remove any leading + or 237
      value = value.replace(/^\+?237?/, '');
      // Add +237 prefix
      value = '+237' + value;
    }
    
    // Limit to Cameroon format: +237XXXXXXXXX (13 characters total: +237 + 9 digits)
    if (value.length > 13) {
      value = value.substring(0, 13);
    }
    
    // Update the form control
    this.patientForm.patchValue({ guardianPhone: value }, { emitEvent: false });
    
    // Update the input field value directly
    input.value = value;
  }

  getPatientAge(birthDate?: string): string {
    if (!birthDate) return 'N/A';
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      const months = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      if (months < 12) {
        return `${months} months`;
      } else {
        const years = Math.floor(months / 12);
        return `${years} years`;
      }
    } catch {
      return 'N/A';
    }
  }
}
