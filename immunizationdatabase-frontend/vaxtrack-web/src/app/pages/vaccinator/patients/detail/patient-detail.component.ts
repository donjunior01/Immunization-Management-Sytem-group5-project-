import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { PatientService } from '../../../../core/services/patient.service';
import { VaccinationService } from '../../../../core/services/vaccination.service';
import { AdverseEventService } from '../../../../core/services/adverse-event.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Patient } from '../../../../core/models/patient.model';
import { VaccinationRecord, AdverseEvent } from '../../../../core/models/vaccination.model';
import { Appointment, CreateAppointmentRequest } from '../../../../core/models/appointment.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { differenceInMonths, differenceInDays, format } from 'date-fns';
import { environment } from '../../../../../environments/environment';
import { ensureMinimumLoadingTime } from '../../../../core/utils/loading.util';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss'
})
export class PatientDetailComponent implements OnInit {
  patient: Patient | null = null;
  vaccinations: VaccinationRecord[] = [];
  adverseEvents: AdverseEvent[] = [];
  appointments: Appointment[] = [];
  loading = false; // Start with false, set to true only when actually loading
  errorMessage = '';
  activeTab: 'overview' | 'vaccinations' | 'appointments' | 'documents' = 'overview';
  vaccinationProgress = 0;
  nextAppointment: Appointment | null = null;

  // Appointment scheduling modal
  showScheduleModal = false;
  scheduleForm: FormGroup;
  availableVaccines: any[] = [];
  schedulingAppointment = false;
  
  // Appointment rescheduling modal
  showRescheduleModal = false;
  rescheduleForm: FormGroup;
  reschedulingAppointment = false;
  appointmentToReschedule: Appointment | null = null;
  
  // Success modal
  showSuccessModal = false;
  createdAppointment: Appointment | null = null;
  isRescheduling = false; // Track if this is a reschedule or new appointment

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private vaccinationService: VaccinationService,
    private adverseEventService: AdverseEventService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    // Initialize schedule form
    this.scheduleForm = this.fb.group({
      vaccineName: ['', [Validators.required]],
      doseNumber: [1, [Validators.required, Validators.min(1)]],
      appointmentDate: [format(new Date(), 'yyyy-MM-dd'), [Validators.required]],
      appointmentTime: ['09:00'],
      notes: ['']
    });
    
    // Initialize reschedule form
    this.rescheduleForm = this.fb.group({
      appointmentDate: ['', [Validators.required]],
      appointmentTime: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    console.log('PatientDetailComponent: ngOnInit called');
    // Check both route params and query params for patientId
    const patientId = this.route.snapshot.paramMap.get('id') || 
                      this.route.snapshot.queryParamMap.get('patientId');
    console.log('PatientDetailComponent: patientId from route:', patientId);
    if (patientId) {
      this.loadPatient(patientId);
    } else {
      console.warn('PatientDetailComponent: No patient ID in route');
      this.errorMessage = 'No patient ID provided';
      this.loading = false;
    }
  }

  loadPatient(id: string): void {
    console.log('PatientDetailComponent: loadPatient called with id:', id);
    this.loading = true;
    this.errorMessage = '';
    const startTime = Date.now();
    let loadingCleared = false;
    
    // Helper function to safely clear loading state
    const clearLoading = () => {
      if (!loadingCleared) {
        loadingCleared = true;
        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
        console.log('PatientDetailComponent: Loading state cleared');
      }
    };
    
    // Set a maximum timeout to prevent infinite loading (8 seconds)
    const maxTimeout = setTimeout(() => {
      console.warn('PatientDetailComponent: Patient load timeout - forcing completion');
      clearLoading();
      if (!this.patient && !this.errorMessage) {
        this.errorMessage = 'Request timed out. Please check your connection and try again.';
      }
    }, 8000);
    
    // Always try real API first, fallback to mock data on error
    console.log('PatientDetailComponent: Calling getPatientById API');
    this.patientService.getPatientById(id).pipe(
      catchError((error) => {
        console.error('PatientDetailComponent: Failed to load patient:', error);
        this.errorMessage = error.error?.message || error.message || 'Failed to load patient details. Please try again.';
        this.patient = null;
        return of(null);
      }),
      finalize(() => {
        console.log('PatientDetailComponent: API call finalized, clearing timeout');
        clearTimeout(maxTimeout);
        // Use ensureMinimumLoadingTime but also set a fallback
        ensureMinimumLoadingTime(startTime, () => {
          clearLoading();
        });
        // Fallback: ensure loading is cleared after max 500ms even if ensureMinimumLoadingTime fails
        setTimeout(() => {
          clearLoading();
        }, 500);
      })
    ).subscribe({
      next: (patientDetail) => {
        console.log('PatientDetailComponent: Received patient data:', patientDetail);
        if (patientDetail) {
          this.patient = patientDetail as any; // Map PatientDetail to Patient
          this.vaccinations = patientDetail.vaccinationHistory || [];
          this.appointments = patientDetail.upcomingAppointments || [];
          this.calculateProgress();
          this.errorMessage = ''; // Clear any previous errors
          console.log('PatientDetailComponent: Patient loaded successfully:', this.patient);
          
          // Also load vaccination history, adverse events, and appointments separately if not included in patient detail
          // These run in background and don't affect the main loading state
          this.loadVaccinationHistory(id);
          this.loadAdverseEvents(id);
          this.loadAppointments(id);
        } else {
          console.warn('PatientDetailComponent: Patient detail is null');
          // If patientDetail is null, ensure loading is cleared
          if (!this.errorMessage) {
            this.errorMessage = 'Patient not found';
          }
        }
      },
      error: (error) => {
        // This should be caught by catchError, but just in case
        console.error('PatientDetailComponent: Unexpected error in subscribe:', error);
        if (!this.errorMessage) {
          this.errorMessage = 'Failed to load patient details';
        }
        // Force clear loading on error
        clearLoading();
      }
    });
  }

  private loadVaccinationHistory(patientId: string): void {
    this.patientService.getPatientVaccinations(patientId).subscribe({
      next: (vaccinations) => {
        this.vaccinations = vaccinations;
        this.calculateProgress();
      },
      error: (error) => {
        console.info('Vaccination history API unavailable, trying alternative endpoint:', error.status);
        // Fallback to alternative endpoint
        this.vaccinationService.getPatientVaccinations(patientId).subscribe({
          next: (vaccinations) => {
            this.vaccinations = vaccinations;
            this.calculateProgress();
          },
          error: (err) => {
            console.info('All vaccination history endpoints unavailable:', err.status);
            // Keep existing mock vaccinations if any
          }
        });
      }
    });
  }

  loadVaccinations(patientId: string): void {
    // Vaccinations are loaded with patient details
    // This method is kept for potential future use
    this.vaccinationService.getPatientVaccinations(patientId).subscribe({
      next: (vaccinations) => {
        this.vaccinations = vaccinations;
        this.calculateProgress();
      },
      error: (error) => {
        console.error('Failed to load vaccinations:', error);
        this.vaccinations = [];
      }
    });
  }

  loadAdverseEvents(patientId: string): void {
    this.adverseEventService.getPatientAdverseEvents(patientId).subscribe({
      next: (events) => {
        this.adverseEvents = events || [];
      },
      error: (error) => {
        // Silently handle 404 - adverse events endpoint might not be available
        if (error.status === 404) {
          console.info('Adverse events endpoint not available, using empty list');
          this.adverseEvents = [];
        } else {
          console.error('Failed to load adverse events:', error);
          this.adverseEvents = [];
        }
      }
    });
  }

  loadAppointments(patientId: string): void {
    // Load appointments using the correct endpoint
    this.appointmentService.getPatientAppointments(patientId).subscribe({
      next: (appointments) => {
        this.appointments = appointments || [];
        this.nextAppointment = appointments.find(a => a.status === 'SCHEDULED') || null;
      },
      error: (error) => {
        // Silently handle 404 - appointments endpoint might not be available
        if (error.status === 404) {
          console.info('Appointments endpoint not available, using empty list');
          this.appointments = [];
        } else {
          console.error('Failed to load appointments:', error);
          this.appointments = [];
        }
      }
    });
  }

  calculateProgress(): void {
    // Calculate vaccination progress (simplified)
    const totalExpected = 10; // Total vaccines in schedule
    const completed = this.vaccinations.length;
    this.vaccinationProgress = Math.round((completed / totalExpected) * 100);
  }

  getPatientAge(): string {
    if (!this.patient?.birthDate && !this.patient?.dateOfBirth) return 'N/A';
    const birthDate = this.patient.birthDate || this.patient.dateOfBirth || '';
    if (!birthDate) return 'N/A';
    
    try {
      const birth = new Date(birthDate);
      const months = differenceInMonths(new Date(), birth);
      if (months < 1) {
        const days = differenceInDays(new Date(), birth);
        return `${days} days`;
      } else if (months < 12) {
        return `${months} months`;
      } else {
        const years = Math.floor(months / 12);
        return `${years} years`;
      }
    } catch {
      return 'N/A';
    }
  }

  getPatientDisplayName(): string {
    if (!this.patient) return 'Unknown Patient';
    return this.patient.fullName || 
           `${this.patient.firstName || ''} ${this.patient.lastName || ''}`.trim() || 
           'Unknown Patient';
  }

  getVaccinationStatus(vaccineName: string, dose: number): string {
    const found = this.vaccinations.find(v => 
      v.vaccineName === vaccineName && v.doseNumber === dose
    );
    if (found) return 'completed';
    
    // Check if due
    const lastVaccination = this.vaccinations
      .filter(v => v.vaccineName === vaccineName)
      .sort((a, b) => new Date(b.administeredDate || b.date || '').getTime() - new Date(a.administeredDate || a.date || '').getTime())[0];
    
    if (lastVaccination) {
      const vaccinationDate = lastVaccination.administeredDate || lastVaccination.date || '';
      if (vaccinationDate) {
        const daysSince = differenceInDays(new Date(), new Date(vaccinationDate));
        if (daysSince >= 28) return 'due';
      }
    }
    
    return 'pending';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✅';
      case 'due': return '🟡';
      default: return '⚪';
    }
  }

  recordVaccination(): void {
    if (this.patient) {
      this.router.navigate(['/vaccinator/vaccinations/record'], {
        queryParams: { patientId: this.patient.id }
      });
    }
  }

  editPatient(): void {
    // Navigate to edit page or open modal
    if (this.patient) {
      // TODO: Navigate to edit page when implemented
      console.log('Edit patient:', this.patient.id);
      // For now, show alert
      alert('Edit patient functionality coming soon');
    }
  }

  scheduleAppointment(): void {
    if (this.patient) {
      this.loadAvailableVaccines();
      this.scheduleForm.patchValue({
        appointmentDate: format(new Date(), 'yyyy-MM-dd'),
        doseNumber: 1
      });
      this.showScheduleModal = true;
    }
  }

  loadAvailableVaccines(): void {
    this.vaccinationService.getAllVaccines().subscribe({
      next: (vaccines) => {
        this.availableVaccines = vaccines || [];
      },
      error: (error) => {
        console.error('Failed to load vaccines:', error);
        this.availableVaccines = [];
      }
    });
  }

  onScheduleSubmit(): void {
    if (this.scheduleForm.valid && this.patient) {
      const user = this.authService.getCurrentUser();
      const facilityId = user?.facilityId || this.patient.facilityId;
      const patientId = this.patient.id || this.patient.patientId;
      
      if (!facilityId) {
        this.errorMessage = 'Facility ID is required. Please ensure you are assigned to a facility.';
        return;
      }

      if (!patientId) {
        this.errorMessage = 'Patient ID is required. Please refresh the page and try again.';
        return;
      }

      this.schedulingAppointment = true;
      const appointmentData: CreateAppointmentRequest = {
        patientId: patientId,
        facilityId: facilityId,
        vaccineName: this.scheduleForm.value.vaccineName,
        doseNumber: parseInt(this.scheduleForm.value.doseNumber, 10),
        appointmentDate: this.scheduleForm.value.appointmentDate,
        appointmentTime: this.scheduleForm.value.appointmentTime || undefined,
        notes: this.scheduleForm.value.notes || undefined
      };

      this.appointmentService.createAppointment(appointmentData).subscribe({
        next: (appointment) => {
          this.schedulingAppointment = false;
          this.showScheduleModal = false;
          this.scheduleForm.reset();
          // Store appointment for success modal
          this.createdAppointment = appointment;
          // Reload appointments
          if (this.patient && patientId) {
            this.loadAppointments(patientId);
          }
          // Show success modal
          this.errorMessage = '';
          this.isRescheduling = false;
          this.showSuccessModal = true;
        },
        error: (error) => {
          this.schedulingAppointment = false;
          this.errorMessage = error.error?.message || error.error?.error || 'Failed to schedule appointment. Please try again.';
          console.error('Error scheduling appointment:', error);
        }
      });
    } else {
      this.scheduleForm.markAllAsTouched();
    }
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.scheduleForm.reset();
    this.errorMessage = '';
  }

  getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  isFieldInvalid(fieldName: string, form: FormGroup = this.scheduleForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string, form: FormGroup = this.scheduleForm): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be at least ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  uploadDocument(): void {
    if (this.patient) {
      // TODO: Open file upload modal or navigate to upload page
      console.log('Upload document for patient:', this.patient.id);
      // For now, show alert
      alert('Document upload functionality coming soon');
    }
  }

  rescheduleAppointment(appointment: Appointment): void {
    if (!appointment || !appointment.id) {
      this.errorMessage = 'Invalid appointment selected.';
      return;
    }
    
    this.appointmentToReschedule = appointment;
    this.rescheduleForm.patchValue({
      appointmentDate: appointment.appointmentDate || format(new Date(), 'yyyy-MM-dd'),
      appointmentTime: appointment.appointmentTime || '09:00',
      notes: appointment.notes || ''
    });
    this.showRescheduleModal = true;
    this.errorMessage = '';
  }
  
  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.appointmentToReschedule = null;
    this.rescheduleForm.reset();
    this.errorMessage = '';
  }
  
  onRescheduleSubmit(): void {
    if (this.rescheduleForm.valid && this.appointmentToReschedule && this.appointmentToReschedule.id) {
      const user = this.authService.getCurrentUser();
      const facilityId = user?.facilityId || this.appointmentToReschedule.facilityId;
      
      if (!facilityId) {
        this.errorMessage = 'Facility ID is required. Please ensure you are assigned to a facility.';
        return;
      }
      
      this.reschedulingAppointment = true;
      this.errorMessage = '';
      
      // Backend expects CreateAppointmentRequest format for updates
      // Include all required fields from the original appointment
      const updateData: CreateAppointmentRequest = {
        patientId: this.appointmentToReschedule.patientId,
        facilityId: facilityId,
        vaccineName: this.appointmentToReschedule.vaccineName,
        doseNumber: this.appointmentToReschedule.doseNumber,
        appointmentDate: this.rescheduleForm.value.appointmentDate,
        appointmentTime: this.rescheduleForm.value.appointmentTime || undefined,
        notes: this.rescheduleForm.value.notes || undefined
      };
      
      this.appointmentService.updateAppointment(this.appointmentToReschedule.id, updateData).subscribe({
        next: (updatedAppointment) => {
          this.reschedulingAppointment = false;
          this.showRescheduleModal = false;
          this.rescheduleForm.reset();
          this.appointmentToReschedule = null;
          
          // Reload appointments
          if (this.patient) {
            const patientId = this.patient.id || this.patient.patientId;
            if (patientId) {
              this.loadAppointments(patientId);
            }
          }
          
          // Show success message
          this.errorMessage = '';
          this.createdAppointment = updatedAppointment;
          this.isRescheduling = true;
          this.showSuccessModal = true;
        },
        error: (error) => {
          this.reschedulingAppointment = false;
          this.errorMessage = error.error?.message || error.error?.error || 'Failed to reschedule appointment. Please try again.';
          console.error('Error rescheduling appointment:', error);
        }
      });
    } else {
      this.rescheduleForm.markAllAsTouched();
    }
  }

  recordVaccinationFromAppointment(appointment: Appointment): void {
    if (this.patient) {
      this.router.navigate(['/vaccinator/vaccinations/record'], {
        queryParams: { 
          patientId: this.patient.id,
          appointmentId: appointment.id,
          vaccineName: appointment.vaccineName,
          doseNumber: appointment.doseNumber
        }
      });
    }
  }

  viewVaccinationDetails(vaccination: VaccinationRecord): void {
    // TODO: Open vaccination details modal or navigate to details page
    console.log('View vaccination details:', vaccination.id);
    // For now, show alert with details
    alert(`Vaccination Details:\n\nVaccine: ${vaccination.vaccineName}\nDose: ${vaccination.doseNumber}\nDate: ${vaccination.administeredDate || vaccination.date}\nBatch: ${vaccination.batchNumber || 'N/A'}`);
  }

  printCard(): void {
    window.print();
  }

  format = format;

  getScheduledAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status === 'SCHEDULED');
  }

  getPastAppointments(): Appointment[] {
    return this.appointments.filter(a => a.status !== 'SCHEDULED');
  }
}

