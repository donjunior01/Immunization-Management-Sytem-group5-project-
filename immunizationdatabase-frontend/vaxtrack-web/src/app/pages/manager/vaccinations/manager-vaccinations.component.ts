import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { PatientService } from '../../../core/services/patient.service';
import { StockService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { VaccinationRecord, CreateVaccinationRequest, Vaccine } from '../../../core/models/vaccination.model';
import { Patient } from '../../../core/models/patient.model';
import { VaccineBatch } from '../../../core/models/stock.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { format } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-vaccinations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-vaccinations.component.html',
  styleUrl: './manager-vaccinations.component.scss'
})
export class ManagerVaccinationsComponent implements OnInit {
  vaccinations: VaccinationRecord[] = [];
  filteredVaccinations: VaccinationRecord[] = [];
  loading = false;
  errorMessage = '';
  searchQuery = '';
  filterDate = ''; // Empty by default to show all vaccinations
  private isLoadingData = false;

  // Modal state
  showRecordModal = false;
  showSuccessModal = false;
  recordedVaccination: any = null;
  vaccinationForm: FormGroup;
  availableVaccines: Vaccine[] = [];
  availableBatches: VaccineBatch[] = [];
  patientSearchQuery = '';
  patientSearchResults: Patient[] = [];
  selectedPatient: Patient | null = null;

  constructor(
    private vaccinationService: VaccinationService,
    private patientService: PatientService,
    private stockService: StockService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.vaccinationForm = this.fb.group({
      patientId: ['', [Validators.required]],
      vaccineId: ['', [Validators.required]],
      doseNumber: [1, [Validators.required, Validators.min(1)]],
      batchNumber: ['', [Validators.required]],
      administeredDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
      administrationSite: ['LEFT_ARM', [Validators.required]],
      adverseEventNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadVaccinations();
    this.loadVaccines();
  }

  loadVaccines(): void {
    this.vaccinationService.getAllVaccines().subscribe({
      next: (vaccines) => {
        this.availableVaccines = vaccines;
      },
      error: (error) => {
        console.warn('Failed to load vaccines:', error);
        this.availableVaccines = [];
      }
    });
  }

  loadVaccinations(): void {
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
    
    this.vaccinationService.getVaccinationsByFacility(facilityId).subscribe({
      next: (vaccinations) => {
        console.log('Loaded vaccinations from backend:', vaccinations?.length || 0, 'total');
        this.vaccinations = vaccinations || [];
        this.applyFilters();
        console.log('After filtering:', this.filteredVaccinations.length, 'vaccinations displayed');
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load vaccinations:', error);
        this.errorMessage = error?.error?.message || 'Failed to load vaccinations. Please try again.';
        this.vaccinations = [];
        this.filteredVaccinations = [];
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

  onDateChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.vaccinations];
    
    // Apply search filter if query exists
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.patientName?.toLowerCase().includes(query) ||
        v.vaccineName?.toLowerCase().includes(query) ||
        v.batchNumber?.toLowerCase().includes(query)
      );
    }
    
    // Apply date filter only if a date is explicitly selected
    if (this.filterDate && this.filterDate.trim() !== '') {
      filtered = filtered.filter(v => {
        const adminDate = v.administeredDate ? format(new Date(v.administeredDate), 'yyyy-MM-dd') : '';
        return adminDate === this.filterDate;
      });
    }
    
    this.filteredVaccinations = filtered;
  }

  // Modal Management
  openRecordModal(): void {
    this.vaccinationForm.reset({
      doseNumber: 1,
      administeredDate: format(new Date(), 'yyyy-MM-dd'),
      administrationSite: 'LEFT_ARM'
    });
    this.selectedPatient = null;
    this.patientSearchResults = [];
    this.availableBatches = [];
    this.showRecordModal = true;
  }

  closeRecordModal(): void {
    this.showRecordModal = false;
    this.vaccinationForm.reset();
    this.selectedPatient = null;
    this.patientSearchResults = [];
    this.availableBatches = [];
  }

  searchPatients(): void {
    const query = this.patientSearchQuery.trim();
    if (query.length < 2) {
      this.patientSearchResults = [];
      return;
    }

    const facilityId = this.authService.getCurrentUser()?.facilityId;
    this.patientService.searchPatients(query, facilityId).subscribe({
      next: (response) => {
        this.patientSearchResults = response.patients.slice(0, 5);
      },
      error: (error) => {
        console.warn('Failed to search patients:', error);
        this.patientSearchResults = [];
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.vaccinationForm.patchValue({ patientId: patient.id });
    this.patientSearchQuery = patient.fullName || `${patient.firstName} ${patient.lastName}`;
    this.patientSearchResults = [];
  }

  onVaccineChange(): void {
    const vaccineId = this.vaccinationForm.get('vaccineId')?.value;
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (vaccineId && facilityId) {
      // Find the vaccine to get its name
      const vaccine = this.availableVaccines.find(v => v.id === vaccineId);
      if (vaccine) {
        console.log('Loading batches for vaccine:', { vaccineId, vaccineName: vaccine.name, facilityId });
        // Use vaccine name for batch lookup
        this.stockService.getBatchesByVaccine(vaccine.name, facilityId).subscribe({
          next: (batches) => {
            console.log(`Loaded ${batches.length} batches for ${vaccine.name}:`, batches);
            this.availableBatches = batches.map(batch => ({
              id: batch.id,
              vaccineId: batch.vaccineId || vaccineId,
              vaccineName: batch.vaccineName || vaccine.name,
              batchNumber: batch.batchNumber,
              quantity: batch.quantity || 0,
              expiryDate: batch.expiryDate,
              receivedDate: batch.receivedDate || batch.expiryDate,
              facilityId: batch.facilityId || facilityId,
              isDepleted: batch.isDepleted || false
            }));
            if (batches.length === 0) {
              console.warn(`No batches found for vaccine: ${vaccine.name} (ID: ${vaccineId})`);
            }
          },
          error: (error) => {
            console.error('Failed to load batches for vaccine:', vaccine.name, error);
            this.availableBatches = [];
          }
        });
      } else {
        console.warn('Vaccine not found in availableVaccines for ID:', vaccineId);
        this.availableBatches = [];
      }
    } else {
      if (!vaccineId) console.warn('No vaccine selected');
      if (!facilityId) console.warn('No facility ID available');
      this.availableBatches = [];
    }
    this.vaccinationForm.patchValue({ batchNumber: '' });
  }

  onRecordSubmit(): void {
    if (this.vaccinationForm.valid) {
      this.loading = true;
      const formValue = this.vaccinationForm.value;
      
      // Get current user for facility ID
      const currentUser = this.authService.getCurrentUser();
      const facilityId = currentUser?.facilityId || '';
      
      if (!facilityId) {
        this.errorMessage = 'Facility ID is required. Please ensure you are assigned to a facility.';
        this.loading = false;
        return;
      }

      // Find the selected vaccine to get its name
      const selectedVaccine = this.availableVaccines.find(v => v.id === formValue.vaccineId);
      if (!selectedVaccine) {
        this.errorMessage = 'Please select a valid vaccine.';
        this.loading = false;
        return;
      }

      // Find the selected batch to get its ID
      const selectedBatch = this.availableBatches.find(b => b.batchNumber === formValue.batchNumber);
      if (!selectedBatch || !selectedBatch.id) {
        this.errorMessage = 'Please select a valid batch.';
        this.loading = false;
        return;
      }

      // Map to backend DTO format (RecordVaccinationRequest)
      const vaccinationRequest: any = {
        patientId: formValue.patientId,
        vaccineName: selectedVaccine.name, // Backend expects vaccineName, not vaccineId
        batchId: selectedBatch.id, // Backend expects batchId (Long), not batchNumber
        doseNumber: formValue.doseNumber,
        dateAdministered: formValue.administeredDate, // Backend expects dateAdministered, not administeredDate
        facilityId: facilityId, // Backend requires facilityId
        administrationSite: formValue.administrationSite || 'LEFT_ARM', // Backend requires administrationSite
        notes: formValue.adverseEventNotes || undefined // Backend expects notes, not adverseEventNotes
      };// Log user role before making request
      console.log('Recording vaccination - User role:', currentUser?.role, 'Facility ID:', facilityId);
      console.log('Vaccination request:', vaccinationRequest);
      
      this.vaccinationService.recordVaccination(vaccinationRequest).subscribe({
        next: (response) => {
          console.log('Vaccination recorded successfully:', response);
          this.loading = false;
          // Store vaccination details for success modal
          this.recordedVaccination = {
            patientName: this.selectedPatient?.fullName || this.selectedPatient?.firstName + ' ' + this.selectedPatient?.lastName || 'Unknown',
            vaccineName: selectedVaccine.name,
            doseNumber: formValue.doseNumber,
            batchNumber: formValue.batchNumber,
            dateAdministered: formValue.administeredDate
          };
          this.closeRecordModal();
          this.errorMessage = ''; // Clear any previous errors
          this.showSuccessModal = true;
          this.loadVaccinations(); // Reload vaccinations to show the new record
        },
        error: (error) => {
          console.error('Failed to record vaccination:', error);const user = this.authService.getCurrentUser();
          if (error.status === 403) {
            this.errorMessage = `Access denied. Your role (${user?.role || 'Unknown'}) may not have permission to record vaccinations. Required roles: HEALTH_WORKER, FACILITY_MANAGER, or GOVERNMENT_OFFICIAL.`;
          } else if (error.status === 400) {
            // Handle validation errors
            const validationErrors = error.error;
            if (typeof validationErrors === 'object' && validationErrors !== null) {
              const errorMessages = Object.values(validationErrors).join(', ');
              this.errorMessage = `Validation error: ${errorMessages}`;
            } else {
              this.errorMessage = error.error?.error || error.error?.message || 'Failed to record vaccination. Please check all required fields.';
            }
          } else {
            this.errorMessage = 'Failed to record vaccination. Please try again.';
          }
          this.loading = false;
        }
      });
    } else {
      this.vaccinationForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.vaccinationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['min']) return 'Value must be at least 1';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.vaccinationForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }
}
