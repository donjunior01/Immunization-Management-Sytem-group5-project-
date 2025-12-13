import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { map } from 'rxjs/operators';
import { VaccinationRealService, RecordVaccinationRequest } from '../../services/vaccination-real.service';
import { PatientService } from '../../services/patient.service';
import { InventoryRealService } from '../../services/inventory-real.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient.model';

interface VaccineBatch {
  id: number;
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  quantityRemaining: number;
  expiryDate: string;
  isExpiringSoon: boolean;
}

@Component({
  selector: 'app-record-vaccination',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './record-vaccination.component.html',
  styleUrls: ['./record-vaccination.component.scss']
})
export class RecordVaccinationComponent implements OnInit {
  vaccinationForm!: FormGroup;
  isLoading = false;
  facilityId = '';

  // Patient autocomplete
  filteredPatients!: Observable<Patient[]>;
  selectedPatient: Patient | null = null;

  // Vaccine batches (FEFO - First Expired First Out)
  availableBatches: VaccineBatch[] = [];
  filteredBatches: VaccineBatch[] = [];

  // Dose options (dynamic based on vaccine type)
  doseOptions = [
    { value: 1, label: 'Dose 1' },
    { value: 2, label: 'Dose 2' },
    { value: 3, label: 'Dose 3' },
    { value: 4, label: 'Booster' }
  ];

  constructor(
    private fb: FormBuilder,
    private vaccinationService: VaccinationRealService,
    private patientService: PatientService,
    private inventoryService: InventoryRealService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    const currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();

    this.initializeForm();
    this.loadAvailableBatches();
    this.setupPatientAutocomplete();
  }

  initializeForm(): void {
    this.vaccinationForm = this.fb.group({
      patientSearch: ['', Validators.required],
      patientId: ['', Validators.required],
      batchId: ['', Validators.required],
      doseNumber: [1, [Validators.required, Validators.min(1)]],
      administeredBy: [this.authService.getCurrentUser()?.fullName || '', Validators.required],
      notes: ['']
    });

    // Listen to batch selection to show batch details
    this.vaccinationForm.get('batchId')?.valueChanges.subscribe(batchId => {
      const selectedBatch = this.availableBatches.find(b => b.id === batchId);
      if (selectedBatch) {
        this.checkBatchAvailability(selectedBatch);
      }
    });
  }

  setupPatientAutocomplete(): void {
    this.filteredPatients = this.vaccinationForm.get('patientSearch')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.patientService.searchPatients(this.facilityId, value);
        }
        return [];
      })
    );
  }

  loadAvailableBatches(): void {
    this.inventoryService.getAvailableBatches(this.facilityId).subscribe({
      next: (batches) => {
        // Sort by expiry date (FEFO - First Expired First Out)
        this.availableBatches = batches
          .filter(b => b.quantityRemaining > 0)
          .map(b => ({
            id: b.id,
            batchNumber: b.batchNumber,
            vaccineName: b.vaccineName,
            manufacturer: b.manufacturer,
            quantityRemaining: b.quantityRemaining,
            expiryDate: b.expiryDate,
            isExpiringSoon: b.isExpiringSoon
          }))
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        this.filteredBatches = [...this.availableBatches];
      },
      error: (error) => {
        console.error('Error loading batches:', error);
        this.showError('Failed to load vaccine batches');
      }
    });
  }

  onPatientSelected(patient: Patient): void {
    this.selectedPatient = patient;
    this.vaccinationForm.patchValue({
      patientId: patient.id,
      patientSearch: `${patient.fullName} (ID: ${patient.id})`
    });
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.fullName} (ID: ${patient.id})` : '';
  }

  filterBatchesByVaccine(vaccineName: string): void {
    if (vaccineName) {
      this.filteredBatches = this.availableBatches.filter(
        b => b.vaccineName.toLowerCase().includes(vaccineName.toLowerCase())
      );
    } else {
      this.filteredBatches = [...this.availableBatches];
    }
  }

  checkBatchAvailability(batch: VaccineBatch): void {
    if (batch.quantityRemaining < 1) {
      this.showError(`Batch ${batch.batchNumber} is out of stock`);
      this.vaccinationForm.get('batchId')?.setValue('');
    } else if (batch.isExpiringSoon) {
      this.snackBar.open(
        `Warning: Batch ${batch.batchNumber} expires on ${batch.expiryDate}`,
        'Noted',
        { duration: 5000, panelClass: ['warning-snackbar'] }
      );
    }
  }

  getSelectedBatch(): VaccineBatch | undefined {
    const batchId = this.vaccinationForm.get('batchId')?.value;
    return this.availableBatches.find(b => b.id === batchId);
  }

  onSubmit(): void {
    if (this.vaccinationForm.valid && this.selectedPatient) {
      this.isLoading = true;

      const formValue = this.vaccinationForm.value;
      const selectedBatch = this.getSelectedBatch();

      if (!selectedBatch) {
        this.showError('Please select a valid vaccine batch');
        this.isLoading = false;
        return;
      }

      const request: RecordVaccinationRequest = {
        patientId: this.selectedPatient!.id,
        batchId: formValue.batchId,
        vaccineName: selectedBatch.vaccineName,
        doseNumber: formValue.doseNumber,
        dateAdministered: new Date().toISOString(),
        facilityId: this.facilityId,
        notes: formValue.notes || undefined
      };

      this.vaccinationService.recordVaccination(request).subscribe({
        next: (vaccination) => {
          this.isLoading = false;
          this.loaderService.show(); // Show loader for 1000ms
          
          setTimeout(() => {
            // Enhanced success notification with vaccine and patient details
            this.notificationService.success(
              `${selectedBatch.vaccineName} (Dose ${vaccination.doseNumber}) administered successfully to ${this.selectedPatient?.fullName}`
            );

            // Ask if user wants to print vaccination card
            setTimeout(() => {
              const printCard = confirm('Would you like to print the vaccination card?');
              if (printCard) {
                this.loaderService.show(); // Show loader before navigation
                setTimeout(() => {
                  this.router.navigate(['/vaccinations/print', this.selectedPatient?.id]);
                }, 1000);
              } else {
                this.resetForm();
              }
            }, 1000);
          }, 1000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error recording vaccination:', error);

          let errorMessage = 'Failed to record vaccination';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid vaccination data. Please check all fields.';
          } else if (error.status === 409) {
            errorMessage = 'This vaccination has already been recorded.';
          }

          this.notificationService.error(errorMessage);
        }
      });
    } else {
      Object.keys(this.vaccinationForm.controls).forEach(key => {
        this.vaccinationForm.get(key)?.markAsTouched();
      });

      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  resetForm(): void {
    this.vaccinationForm.reset({
      doseNumber: 1,
      administeredBy: this.authService.getCurrentUser()?.fullName || ''
    });
    this.selectedPatient = null;
    this.loadAvailableBatches(); // Refresh batches to update stock levels
  }

  onCancel(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.vaccinationForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least 1`;
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      patientSearch: 'Patient',
      patientId: 'Patient',
      batchId: 'Vaccine Batch',
      doseNumber: 'Dose Number',
      administeredBy: 'Administered By',
      notes: 'Notes'
    };
    return labels[fieldName] || fieldName;
  }
}
