import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Appointment } from '../../../core/models/appointment.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { format } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-manager-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './manager-appointments.component.html',
  styleUrl: './manager-appointments.component.scss'
})
export class ManagerAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  selectedDate = format(new Date(), 'yyyy-MM-dd');
  filterStatus = 'all';
  private isLoadingData = false;

  // Reschedule modal
  showRescheduleModal = false;
  selectedAppointment: Appointment | null = null;
  rescheduleForm: FormGroup;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.rescheduleForm = this.fb.group({
      newDate: ['', [Validators.required]],
      newTime: ['09:00'],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
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
    
    this.appointmentService.getAppointments(facilityId, this.selectedDate).subscribe({
      next: (appointments) => {
        this.appointments = appointments || [];
        this.applyFilters();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.warn('Failed to load appointments:', error);
        this.errorMessage = 'Failed to load appointments';
        this.appointments = [];
        this.filteredAppointments = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onDateChange(): void {
    this.loadAppointments();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.appointments];
    
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.filterStatus);
    }
    
    this.filteredAppointments = filtered;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'status-scheduled';
      case 'COMPLETED': return 'status-completed';
      case 'MISSED': return 'status-missed';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  openRescheduleModal(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    const currentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate) : new Date();
    this.rescheduleForm.reset({
      newDate: format(currentDate, 'yyyy-MM-dd'),
      newTime: format(currentDate, 'HH:mm'),
      reason: ''
    });
    this.showRescheduleModal = true;
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedAppointment = null;
    this.rescheduleForm.reset();
  }

  onRescheduleSubmit(): void {
    if (this.rescheduleForm.valid && this.selectedAppointment) {
      this.loading = true;
      const formValue = this.rescheduleForm.value;
      const appointment = this.selectedAppointment; // Store in local variable for null safety
      const appointmentId = appointment.id; // Store ID for use in callbacks
      
      // Backend expects CreateAppointmentRequest with all required fields
      // Extract date part (YYYY-MM-DD) and time part (HH:mm)
      const dateStr = formValue.newDate; // Already in YYYY-MM-DD format
      const timeStr = formValue.newTime || '09:00'; // HH:mm format
      
      const updateRequest = {
        patientId: appointment.patientId,
        facilityId: appointment.facilityId,
        vaccineName: appointment.vaccineName,
        doseNumber: appointment.doseNumber,
        appointmentDate: dateStr, // YYYY-MM-DD format
        appointmentTime: timeStr, // HH:mm format
        notes: formValue.reason || appointment.notes || undefined
      };this.appointmentService.updateAppointment(appointmentId, updateRequest).subscribe({
        next: () => {this.loading = false;
          this.closeRescheduleModal();
          this.loadAppointments();
        },
        error: (error) => {console.error('Failed to reschedule appointment:', error);
          // Extract validation errors if present
          if (error?.error && typeof error.error === 'object') {
            const validationErrors = Object.keys(error.error).map(key => `${key}: ${error.error[key]}`).join(', ');
            this.errorMessage = validationErrors || error?.error?.message || error?.message || 'Failed to reschedule appointment. Please try again.';
          } else {
            this.errorMessage = error?.error?.message || error?.message || 'Failed to reschedule appointment. Please try again.';
          }
          this.loading = false;
        }
      });
    } else {
      this.rescheduleForm.markAllAsTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.rescheduleForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.rescheduleForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }
}
