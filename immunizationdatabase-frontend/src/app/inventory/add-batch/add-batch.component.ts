import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InventoryService, BatchCreateRequest } from '../../services/inventory.service';
import { MatProgressBar } from "@angular/material/progress-bar";

@Component({
  selector: 'app-add-batch-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatProgressBar
],
  templateUrl: './add-batch.component.html',
  styleUrls: ['./add-batch.component.scss']
})
export class AddBatchModalComponent implements OnInit, OnDestroy {
  basicInfoForm: FormGroup;
  storageForm: FormGroup;
  additionalForm: FormGroup;

  submitting = false;
  currentStep = 0;

  vaccineNames: string[] = [
    'COVID-19 (Pfizer-BioNTech)',
    'COVID-19 (Moderna)',
    'COVID-19 (AstraZeneca)',
    'Influenza (Flu)',
    'MMR (Measles, Mumps, Rubella)',
    'Hepatitis B',
    'Tetanus (TD)',
    'Polio (IPV)',
    'BCG (Tuberculosis)',
    'Varicella (Chickenpox)',
    'HPV (Human Papillomavirus)',
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
    'Sinovac Biotech'
  ];

  filteredVaccineNames!: Observable<string[]>;
  filteredManufacturers!: Observable<string[]>;

  minDate = new Date();
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private dialogRef: MatDialogRef<AddBatchModalComponent>,
    private snackBar: MatSnackBar
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
    this.storageForm = this.createStorageForm();
    this.additionalForm = this.createAdditionalForm();
  }

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
      storage_location: [''],
      temperature: [null, [Validators.min(-100), Validators.max(50)]]
    });
  }

  createAdditionalForm(): FormGroup {
    return this.fb.group({
      notes: ['', Validators.maxLength(500)]
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

  onSubmit(): void {
    if (!this.isAllFormsValid()) {
      this.showError('Please complete all required fields');
      return;
    }

    this.submitting = true;

    const batch: BatchCreateRequest = {
      ...this.basicInfoForm.value,
      ...this.storageForm.value,
      ...this.additionalForm.value,
      quantity: Number(this.basicInfoForm.value.quantity),
      expiry_date: this.storageForm.value.expiry_date ?
        new Date(this.storageForm.value.expiry_date).toISOString().split('T')[0] : '',
      temperature: this.storageForm.value.temperature ?
        Number(this.storageForm.value.temperature) : null
    };

    const createSub = this.inventoryService.createBatch(batch).subscribe({
      next: (response) => {
        this.showSuccess('Vaccine batch registered successfully!');
        this.dialogRef.close({ success: true, data: response });
      },
      error: (error) => {
        console.error('Batch creation error:', error);
        this.showError('Failed to register batch: ' + (error.message || 'Unknown error'));
        this.submitting = false;
      }
    });

    this.subscriptions.add(createSub);
  }

  isAllFormsValid(): boolean {
    return this.basicInfoForm.valid && this.storageForm.valid && this.additionalForm.valid;
  }

  getFormCompletionPercentage(): number {
    const totalFields = 8; // Total required and optional fields
    let completedFields = 0;

    if (this.basicInfoForm.get('vaccine_name')?.value) completedFields++;
    if (this.basicInfoForm.get('batch_number')?.value) completedFields++;
    if (this.basicInfoForm.get('manufacturer')?.value) completedFields++;
    if (this.basicInfoForm.get('quantity')?.value) completedFields++;
    if (this.storageForm.get('expiry_date')?.value) completedFields++;
    if (this.storageForm.get('storage_location')?.value) completedFields++;
    if (this.storageForm.get('temperature')?.value) completedFields++;
    if (this.additionalForm.get('notes')?.value) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        this.dialogRef.close({ success: false });
      }
    } else {
      this.dialogRef.close({ success: false });
    }
  }

  hasUnsavedChanges(): boolean {
    return this.basicInfoForm.dirty || this.storageForm.dirty || this.additionalForm.dirty;
  }

  hasError(form: FormGroup, controlName: string, errorType: string): boolean {
    const control = form.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  // Helper methods for template
  get batchNumberControl() { return this.basicInfoForm.get('batch_number'); }
  get quantityControl() { return this.basicInfoForm.get('quantity'); }
  get temperatureControl() { return this.storageForm.get('temperature'); }
  get notesControl() { return this.additionalForm.get('notes'); }
}