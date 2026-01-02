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

@Component({
  selector: 'app-manager-receive-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './manager-receive-stock.component.html',
  styleUrl: './manager-receive-stock.component.scss'
})
export class ManagerReceiveStockComponent implements OnInit {
  receiveForm: FormGroup;
  loading = false;
  errorMessage = '';
  showSuccessModal = false;
  successData: any = null;
  availableVaccines: Vaccine[] = [];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private vaccinationService: VaccinationService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.receiveForm = this.fb.group({
      vaccineId: ['', [Validators.required]],
      batchNumber: ['', [Validators.required]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      expiryDate: ['', [Validators.required]],
      receivedDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      receivedFrom: ['']
    });
  }

  ngOnInit(): void {
    this.loadVaccines();
    // Set default received date to today
    this.receiveForm.patchValue({
      receivedDate: new Date().toISOString().split('T')[0]
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

  onSubmit(): void {
    if (this.receiveForm.valid) {
      // Check expiry date warning
      const expiryDate = new Date(this.receiveForm.value.expiryDate);
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      if (expiryDate < sixMonthsFromNow) {
        if (!confirm('Warning: Expiry date is less than 6 months away. Continue anyway?')) {
          return;
        }
      }

      this.loading = true;
      this.errorMessage = '';

      // Map form fields to API request format
      const stockData = {
        vaccineId: this.receiveForm.value.vaccineId,
        batchNumber: this.receiveForm.value.batchNumber,
        quantity: this.receiveForm.value.quantity,
        expiryDate: this.receiveForm.value.expiryDate,
        receivedDate: this.receiveForm.value.receivedDate,
        receivedFrom: this.receiveForm.value.receivedFrom || undefined
      };

      this.stockService.receiveStock(stockData).subscribe({
        next: (response) => {
        this.loading = false;
        this.successData = {
            vaccine: this.receiveForm.value.vaccineId,
          batch: this.receiveForm.value.batchNumber,
          quantity: this.receiveForm.value.quantity,
          expiry: this.receiveForm.value.expiryDate,
            newTotal: response?.quantityRemaining || this.receiveForm.value.quantity
        };
        this.showSuccessModal = true;
        this.toastService.success('Stock received successfully!');
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Failed to receive stock. Please try again.';
          if (error.error?.message?.includes('already exists')) {
            this.errorMessage = 'Batch number already exists for this vaccine. Please use a different batch number.';
          }
        }
      });
    } else {
      this.receiveForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/manager/stock']);
  }

  onSaveAndAddAnother(): void {
    if (this.receiveForm.valid) {
      this.onSubmit();
      setTimeout(() => {
        this.showSuccessModal = false;
        this.receiveForm.reset({
          receivedDate: new Date().toISOString().split('T')[0],
          storageLocation: 'Fridge 1'
        });
      }, 2000);
    }
  }

  onViewInventory(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/manager/stock']);
  }

  getFieldError(fieldName: string): string {
    const field = this.receiveForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const labels: { [key: string]: string } = {
          'vaccineId': 'Vaccine',
          'batchNumber': 'Batch number',
          'quantity': 'Quantity',
          'expiryDate': 'Expiry date',
          'receivedDate': 'Received date'
        };
        return `${labels[fieldName] || fieldName} is required`;
      }
      if (field.errors['min']) return 'Quantity must be at least 1';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.receiveForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}

