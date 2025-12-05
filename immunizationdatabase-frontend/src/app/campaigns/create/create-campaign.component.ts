import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CampaignService } from '../../services/campaign.service';
import { AuthService } from '../../services/auth.service';
import { CreateCampaignRequest } from '../../models/campaign.model';

@Component({
  selector: 'app-create-campaign',
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
    MatSelectModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss']
})
export class CreateCampaignComponent implements OnInit {
  campaignForm: FormGroup;
  submitting = false;

  vaccineTypes = [
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
    'COVID-19'
  ];

  ageGroups = [
    'Birth - 6 weeks',
    '6 weeks - 2 months',
    '2 - 4 months',
    '4 - 6 months',
    '6 - 12 months',
    '12 - 18 months',
    '18 months - 5 years',
    '5 - 12 years',
    '12 - 18 years',
    'Adults (18+)',
    'Seniors (60+)',
    'All Ages'
  ];

  minStartDate = new Date();
  minEndDate = new Date();

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.campaignForm = this.createCampaignForm();
  }

  ngOnInit(): void {
    this.setupDateValidation();
  }

  createCampaignForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      vaccineName: ['', Validators.required],
      targetAgeGroup: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      targetPopulation: [null, [Validators.min(1), Validators.max(10000000)]]
    });
  }

  setupDateValidation(): void {
    this.campaignForm.get('startDate')?.valueChanges.subscribe(startDate => {
      if (startDate) {
        this.minEndDate = new Date(startDate);
        const endDateControl = this.campaignForm.get('endDate');
        if (endDateControl?.value && new Date(endDateControl.value) < this.minEndDate) {
          endDateControl.setValue('');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.campaignForm.invalid) {
      this.markFormGroupTouched(this.campaignForm);
      this.showError('Please complete all required fields correctly');
      return;
    }

    this.submitting = true;

    const formValue = this.campaignForm.value;
    
    // Use authService.getFacilityId() which handles all user types correctly
    const facilityId = this.authService.getFacilityId();

    if (facilityId === 'NATIONAL') {
      this.showError('Government officials should create campaigns at district/facility level');
      this.submitting = false;
      return;
    }

    const request: CreateCampaignRequest = {
      name: formValue.name,
      description: formValue.description || undefined,
      vaccineName: formValue.vaccineName,
      targetAgeGroup: formValue.targetAgeGroup || undefined,
      startDate: this.formatDateForBackend(formValue.startDate),
      endDate: this.formatDateForBackend(formValue.endDate),
      targetPopulation: formValue.targetPopulation ? Number(formValue.targetPopulation) : undefined,
      facilityId: facilityId
    };

    this.campaignService.createCampaign(request).subscribe({
      next: (response) => {
        this.showSuccess('Campaign created successfully!');
        setTimeout(() => {
          this.router.navigate(['/campaigns/active']);
        }, 1500);
      },
      error: (error) => {
        console.error('Campaign creation error:', error);
        this.showError('Failed to create campaign: ' + (error.error?.message || error.message || 'Unknown error'));
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
    if (this.campaignForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.router.navigate(['/campaigns/active']);
      }
    } else {
      this.router.navigate(['/campaigns/active']);
    }
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.campaignForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getErrorMessage(controlName: string): string {
    const control = this.campaignForm.get(controlName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required')) return 'This field is required';
    if (control.hasError('minlength')) return `Minimum length is ${control.errors['minlength'].requiredLength}`;
    if (control.hasError('maxlength')) return `Maximum length is ${control.errors['maxlength'].requiredLength}`;
    if (control.hasError('min')) return `Minimum value is ${control.errors['min'].min}`;
    if (control.hasError('max')) return `Maximum value is ${control.errors['max'].max}`;

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
