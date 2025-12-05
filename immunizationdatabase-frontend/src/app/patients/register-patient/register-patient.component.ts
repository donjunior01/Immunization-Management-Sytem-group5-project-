import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { CreatePatientRequest } from '../../models/patient.model';

@Component({
  selector: 'app-register-patient',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register-patient.component.html',
  styleUrls: ['./register-patient.component.scss']
})
export class RegisterPatientComponent implements OnInit {
  patientForm!: FormGroup;
  isLoading = false;
  maxDate = new Date(); // Can't register future dates
  facilityId = '';

  genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();

    this.patientForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      guardianName: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,15}$/)]],
      address: ['']
    });
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.isLoading = true;

      const formValue = this.patientForm.value;
      const dateOfBirth = new Date(formValue.dateOfBirth);

      const request: CreatePatientRequest = {
        fullName: formValue.fullName,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Format: YYYY-MM-DD
        gender: formValue.gender,
        guardianName: formValue.guardianName,
        phoneNumber: formValue.phoneNumber || undefined,
        address: formValue.address || undefined,
        facilityId: this.facilityId
      };

      this.patientService.createPatient(request).subscribe({
        next: (patient) => {
          this.isLoading = false;
          this.snackBar.open(
            `Patient registered successfully! ID: ${patient.id}`,
            'Close',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );

          // Reset form for next registration
          this.patientForm.reset();

          // Navigate to patient list after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/patients/list']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error registering patient:', error);

          let errorMessage = 'Failed to register patient';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Invalid patient data. Please check all fields.';
          } else if (error.status === 409) {
            errorMessage = 'A patient with this information already exists.';
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.patientForm.controls).forEach(key => {
        this.patientForm.get(key)?.markAsTouched();
      });

      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/patients/list']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.patientForm.get(fieldName);

    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }

    if (control?.hasError('pattern')) {
      return 'Please enter a valid phone number (10-15 digits)';
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      fullName: 'Full Name',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      guardianName: 'Guardian Name',
      phoneNumber: 'Phone Number',
      address: 'Address'
    };
    return labels[fieldName] || fieldName;
  }
}
