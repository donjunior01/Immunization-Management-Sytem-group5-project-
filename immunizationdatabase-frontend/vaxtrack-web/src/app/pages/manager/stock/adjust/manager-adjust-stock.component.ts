import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { StockService } from '../../../../core/services/stock.service';
import { VaccinationService } from '../../../../core/services/vaccination.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { Vaccine } from '../../../../core/models/vaccination.model';
import { VaccineBatch, AdjustStockRequest } from '../../../../core/models/stock.model';

@Component({
  selector: 'app-manager-adjust-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './manager-adjust-stock.component.html',
  styleUrl: './manager-adjust-stock.component.scss'
})
export class ManagerAdjustStockComponent implements OnInit {
  adjustForm: FormGroup;
  loading = false;
  errorMessage = '';
  showConfirmModal = false;
  showSuccessModal = false;
  successData: any = null;

  availableVaccines: Vaccine[] = [];
  availableBatches: VaccineBatch[] = [];
  selectedBatch: VaccineBatch | null = null;
  loadingBatches = false;

  adjustmentReasons = [
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'LOST', label: 'Lost' },
    { value: 'CORRECTION', label: 'Correction' }
  ];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private vaccinationService: VaccinationService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.adjustForm = this.fb.group({
      vaccineId: ['', [Validators.required]],
      batchNumber: ['', [Validators.required]],
      quantityChange: ['', [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadVaccines();
    
    // Load batches when vaccine changes
    this.adjustForm.get('vaccineId')?.valueChanges.subscribe(vaccineId => {
      if (vaccineId) {
        this.loadBatches(vaccineId);
      } else {
        this.availableBatches = [];
        this.adjustForm.get('batchNumber')?.setValue('');
      }
    });

    // Update current quantity when batch changes
    this.adjustForm.get('batchNumber')?.valueChanges.subscribe(batchNumber => {
      if (batchNumber) {
        this.selectedBatch = this.availableBatches.find(b => b.batchNumber === batchNumber) || null;
      } else {
        this.selectedBatch = null;
      }
    });
  }

  loadVaccines(): void {
    this.vaccinationService.getAllVaccines().subscribe({
      next: (vaccines) => {
        this.availableVaccines = vaccines || [];
      },
      error: (error) => {
        console.error('Failed to load vaccines:', error);
        // Fallback to common vaccine types
        this.availableVaccines = [
          { id: 'bcg', name: 'BCG' },
          { id: 'opv', name: 'OPV' },
          { id: 'dtp', name: 'DTP' },
          { id: 'measles', name: 'Measles' },
          { id: 'hepatitis-b', name: 'Hepatitis B' },
          { id: 'rotavirus', name: 'Rotavirus' },
          { id: 'covid-19', name: 'COVID-19' },
          { id: 'tetanus', name: 'Tetanus' },
          { id: 'yellow-fever', name: 'Yellow Fever' },
          { id: 'meningitis', name: 'Meningitis' }
        ] as Vaccine[];
      }
    });
  }

  loadBatches(vaccineId: string): void {
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
    
    if (!facilityId) {
      this.errorMessage = 'Facility ID not found';
      return;
    }

    // Find vaccine name from available vaccines
    const vaccine = this.availableVaccines.find(v => v.id === vaccineId || v.name === vaccineId);
    const vaccineName = vaccine?.name || vaccineId;

    this.loadingBatches = true;
    this.availableBatches = [];
    this.adjustForm.get('batchNumber')?.disable();

    this.stockService.getBatchesByVaccine(vaccineName, facilityId).subscribe({
      next: (batches) => {
        this.availableBatches = batches || [];
        this.loadingBatches = false;
        if (batches && batches.length > 0) {
          this.adjustForm.get('batchNumber')?.enable();
        } else {
          this.errorMessage = `No batches found for ${vaccineName}`;
        }
      },
      error: (error) => {
        console.error('Failed to load batches:', error);
        this.loadingBatches = false;
        this.errorMessage = 'Failed to load batches';
      }
    });
  }

  onSubmit(): void {
    if (this.adjustForm.valid) {
      const quantityChange = this.adjustForm.value.quantityChange;
      
      // For subtract operations, show confirmation modal
      if (quantityChange < 0) {
        this.showConfirmModal = true;
      } else {
        this.submitAdjustment();
      }
    } else {
      this.adjustForm.markAllAsTouched();
    }
  }

  submitAdjustment(): void {
    this.loading = true;
    this.errorMessage = '';
    this.showConfirmModal = false;

    const formValue = this.adjustForm.value;
    
    // Find vaccine name
    const vaccine = this.availableVaccines.find(v => v.id === formValue.vaccineId || v.name === formValue.vaccineId);
    const vaccineName = vaccine?.name || formValue.vaccineId;

    const adjustmentRequest: AdjustStockRequest = {
      vaccineId: vaccineName,
      batchNumber: formValue.batchNumber,
      quantityChange: formValue.quantityChange,
      reason: formValue.reason,
      notes: formValue.notes || undefined
    };

    this.stockService.adjustStock(adjustmentRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.successData = {
          vaccine: vaccineName,
          batch: formValue.batchNumber,
          quantityChange: formValue.quantityChange,
          reason: formValue.reason,
          newQuantity: response?.quantityRemaining || (this.selectedBatch?.quantity || 0) + formValue.quantityChange
        };
        this.showSuccessModal = true;
        this.toastService.success('Stock adjusted successfully!');
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Failed to adjust stock. Please try again.';
        if (error.error?.message?.includes('Insufficient stock')) {
          this.errorMessage = 'Insufficient stock for this adjustment.';
        }
      }
    });
  }

  confirmAdjustment(): void {
    this.submitAdjustment();
  }

  onViewInventory(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/manager/stock']);
  }

  onAdjustMore(): void {
    this.showSuccessModal = false;
    this.adjustForm.reset();
    this.availableBatches = [];
    this.selectedBatch = null;
  }

  getFieldError(fieldName: string): string {
    const field = this.adjustForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const labels: { [key: string]: string } = {
          'vaccineId': 'Vaccine',
          'batchNumber': 'Batch number',
          'quantityChange': 'Quantity change',
          'reason': 'Reason'
        };
        return `${labels[fieldName] || fieldName} is required`;
      }
      if (field.errors['min']) return 'Quantity must be at least 1';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.adjustForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getCurrentQuantity(): number {
    return this.selectedBatch?.quantity || 0;
  }

  getNewQuantity(): number {
    const quantityChange = this.adjustForm.value.quantityChange || 0;
    return this.getCurrentQuantity() + quantityChange;
  }
}
