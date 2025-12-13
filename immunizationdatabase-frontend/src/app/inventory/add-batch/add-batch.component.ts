import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InventoryRealService, CreateVaccineBatchRequest, VaccineBatchResponse } from '../../services/inventory-real.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-add-batch',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatStepperModule,
    MatProgressBarModule
  ],
  templateUrl: './add-batch.component.html',
  styleUrls: ['./add-batch.component.scss']
})
export class AddBatchComponent implements OnInit {
  batchForm: FormGroup;
  basicInfoForm: FormGroup;
  storageForm: FormGroup;
  additionalForm: FormGroup;
  submitting = false;
  editMode = false;
  batchId: number | null = null;
  currentBatch: VaccineBatchResponse | null = null;
  currentStep = 0;
  minDate = new Date();

  vaccineNames: string[] = [
    'BCG',
    'Polio',
    'DTP',
    'Hepatitis B',
    'Measles',
    'Rotavirus',
    'Pneumococcal',
    'HPV',
    'Tetanus',
    'Varicella',
    'Influenza',
    'Meningococcal'
  ];

  manufacturers: string[] = [
    'Pfizer',
    'Moderna',
    'Johnson & Johnson',
    'AstraZeneca',
    'Novavax',
    'GlaxoSmithKline',
    'Merck',
    'Sanofi',
    'Serum Institute of India',
    'Sinovac Biotech',
    'Bharat Biotech'
  ];

  filteredVaccineNames!: Observable<string[]>;
  filteredManufacturers!: Observable<string[]>;

  minReceiptDate = new Date(2020, 0, 1); // Jan 1, 2020
  maxReceiptDate = new Date();
  minExpiryDate = new Date();

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryRealService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
    this.storageForm = this.createStorageForm();
    this.additionalForm = this.createAdditionalForm();
    this.batchForm = this.createBatchForm();
  }

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.setupAutocomplete();
    this.checkEditMode();
  }

  createBasicInfoForm(): FormGroup {
    return this.fb.group({
      vaccine_name: ['', [Validators.required, Validators.minLength(2)]],
      batch_number: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      manufacturer: ['', [Validators.required, Validators.minLength(2)]],
      quantity: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]]
    });
  }

  createStorageForm(): FormGroup {
    return this.fb.group({
      expiry_date: ['', Validators.required],
      receipt_date: [new Date(), Validators.required],
      storage_location: [''],
      temperature: [null, [Validators.min(-80), Validators.max(25)]],
      notes: ['']
    });
  }

  createAdditionalForm(): FormGroup {
    return this.fb.group({
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  createBatchForm(): FormGroup {
    return this.fb.group({
      vaccineName: ['', [Validators.required, Validators.minLength(2)]],
      batchNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      manufacturer: ['', [Validators.required, Validators.minLength(2)]],
      quantityReceived: [null, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      expiryDate: ['', Validators.required],
      receiptDate: [new Date(), Validators.required]
    });
  }

  setupAutocomplete(): void {
    this.filteredVaccineNames = this.basicInfoForm.get('vaccine_name')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.vaccineNames))
    );

    this.filteredManufacturers = this.basicInfoForm.get('manufacturer')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.manufacturers))
    );
  }

  private _filter(value: string, options: string[]): string[] {
    if (!value) return options.slice(0, 8);
    const filterValue = value.toLowerCase();
    return options.filter(option =>
      option.toLowerCase().includes(filterValue)
    ).slice(0, 8);
  }

  checkEditMode(): void {
    this.route.queryParams.subscribe(params => {
      const id = params['batchId'];
      if (id) {
        this.editMode = true;
        this.batchId = parseInt(id, 10);
        this.loadBatchData();
      }
    });
  }

  loadBatchData(): void {
    if (!this.batchId) return;

    this.submitting = true;
    this.inventoryService.getBatchById(this.batchId).subscribe({
      next: (batch) => {
        this.currentBatch = batch;
        // Update basicInfoForm
        this.basicInfoForm.patchValue({
          vaccine_name: batch.vaccineName,
          batch_number: batch.batchNumber,
          manufacturer: batch.manufacturer,
          quantity: batch.quantityReceived
        });
        // Update storageForm
        this.storageForm.patchValue({
          expiry_date: new Date(batch.expiryDate),
          receipt_date: new Date(batch.receiptDate),
          storage_location: batch.facilityId,
          temperature: null,
          notes: ''
        });
        // Update combined form
        this.batchForm.patchValue({
          vaccineName: batch.vaccineName,
          batchNumber: batch.batchNumber,
          manufacturer: batch.manufacturer,
          quantityReceived: batch.quantityReceived,
          expiryDate: new Date(batch.expiryDate),
          receiptDate: new Date(batch.receiptDate)
        });
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error loading batch:', error);
        this.notificationService.error('Failed to load batch data');
        this.submitting = false;
        this.loaderService.show(); // Show loader before navigation
        setTimeout(() => {
          this.router.navigate(['/inventory']);
        }, 1000);
      }
    });
  }

  onSubmit(): void {
    if (this.basicInfoForm.invalid || this.storageForm.invalid) {
      this.markFormGroupTouched(this.basicInfoForm);
      this.markFormGroupTouched(this.storageForm);
      this.notificationService.warning('Please complete all required fields correctly');
      return;
    }

    this.submitting = true;

    const basicInfo = this.basicInfoForm.value;
    const storageInfo = this.storageForm.value;
    
    // Use getFacilityId() which properly returns facilityId from the user object
    const facilityId = this.authService.getFacilityId();

    // Government officials shouldn't create batches at national level
    if (facilityId === 'NATIONAL') {
      this.notificationService.error('Government officials cannot add batches - manage at facility level');
      this.submitting = false;
      return;
    }

    if (!facilityId) {
      this.notificationService.error('No facility ID found for current user');
      this.submitting = false;
      return;
    }

    const request: CreateVaccineBatchRequest = {
      batchNumber: basicInfo.batch_number,
      vaccineName: basicInfo.vaccine_name,
      manufacturer: basicInfo.manufacturer,
      quantityReceived: Number(basicInfo.quantity),
      expiryDate: this.formatDateForBackend(storageInfo.expiry_date),
      receiptDate: this.formatDateForBackend(storageInfo.receipt_date),
      facilityId: facilityId
    };

    if (this.editMode && this.batchId) {
      this.updateBatch(request);
    } else {
      this.createBatch(request);
    }
  }

  createBatch(request: CreateVaccineBatchRequest): void {
    this.inventoryService.createBatch(request).subscribe({
      next: (response) => {
        this.loaderService.show(); // Show loader for 1000ms
        setTimeout(() => {
          // Enhanced batch creation confirmation with details
          this.notificationService.success(
            `Batch ${request.batchNumber} (${request.vaccineName}) created successfully - ${request.quantityReceived} units added to inventory`
          );
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        }, 1000);
      },
      error: (error) => {
        console.error('Batch creation error:', error);
        this.notificationService.error('Failed to register batch: ' + (error.error?.message || error.message || 'Unknown error'));
        this.submitting = false;
      }
    });
  }

  updateBatch(request: CreateVaccineBatchRequest): void {
    if (!this.batchId) return;

    this.inventoryService.updateBatch(this.batchId, request).subscribe({
      next: (response) => {
        this.loaderService.show(); // Show loader for 1000ms
        setTimeout(() => {
          this.notificationService.success(`Batch ${request.batchNumber} updated successfully`);
          setTimeout(() => {
            this.router.navigate(['/inventory']);
          }, 1500);
        }, 1000);
      },
      error: (error) => {
        console.error('Batch update error:', error);
        this.notificationService.error('Failed to update batch: ' + (error.error?.message || error.message || 'Unknown error'));
        this.submitting = false;
      }
    });
  }

  formatDateForBackend(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    if (this.basicInfoForm.dirty || this.storageForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/inventory']);
      }
    } else {
      this.router.navigate(['/inventory']);
    }
  }

  hasError(form: FormGroup, controlName: string, errorType: string): boolean {
    const control = form.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  isAllFormsValid(): boolean {
    return this.basicInfoForm.valid && this.storageForm.valid;
  }

  get batchNumberControl() {
    return this.basicInfoForm.get('batch_number');
  }

  get notesControl() {
    return this.additionalForm.get('notes');
  }

  getFormCompletionPercentage(): number {
    const basicValid = this.basicInfoForm.valid ? 40 : 0;
    const storageValid = this.storageForm.valid ? 40 : 0;
    const additionalValid = this.additionalForm.valid ? 20 : 0;
    return basicValid + storageValid + additionalValid;
  }

  getErrorMessage(controlName: string): string {
    const control = this.batchForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('minlength')) return `Minimum length is ${control.errors['minlength'].requiredLength}`;
    if (control.hasError('min')) return `Minimum value is ${control.errors['min'].min}`;
    if (control.hasError('max')) return `Maximum value is ${control.errors['max'].max}`;
    if (control.hasError('pattern')) return 'Invalid format (use uppercase letters, numbers, and hyphens)';

    return 'Invalid value';
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
