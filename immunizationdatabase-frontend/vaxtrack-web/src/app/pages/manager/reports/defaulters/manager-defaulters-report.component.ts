import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { PatientService } from '../../../../core/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manager-defaulters-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent, DatePipe],
  templateUrl: './manager-defaulters-report.component.html',
  styleUrl: './manager-defaulters-report.component.scss'
})
export class ManagerDefaultersReportComponent implements OnInit, OnDestroy {
  loading = false;
  errorMessage = '';
  filterForm: FormGroup;
  
  totalDefaulters = 0;
  defaultersByDuration = {
    '1-4 weeks': 0,
    '1-3 months': 0,
    '3+ months': 0
  };
  
  defaulters: any[] = [];
  filteredDefaulters: any[] = [];
  vaccines: string[] = [];
  private subscription?: Subscription;
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      duration: ['all'],
      vaccine: ['all']
    });
  }

  ngOnInit(): void {
    this.loadDefaulters();
  }

  loadDefaulters(): void {
    // Cancel any existing subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    this.loading = true;
    this.errorMessage = '';
    const facilityId = this.authService.getCurrentUser()?.facilityId;
    
    if (!facilityId) {
      this.errorMessage = 'No facility ID available';
      this.loading = false;
      return;
    }

    // Reset defaulters data
    this.defaulters = [];
    this.filteredDefaulters = [];
    this.totalDefaulters = 0;
    this.defaultersByDuration = {
      '1-4 weeks': 0,
      '1-3 months': 0,
      '3+ months': 0
    };
    this.vaccines = [];

    // Safety timeout to prevent infinite loading
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
        console.warn('Defaulters loading timeout - forcing stop');
        this.loading = false;
        this.errorMessage = 'Request timed out. Please try again.';
        if (this.subscription) {
          this.subscription.unsubscribe();
        }
      }
    }, 10000); // 10 second timeout

    // Get all appointments
    this.subscription = this.appointmentService.getAppointments(facilityId).subscribe({
      next: (appointments) => {
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        try {
          const now = new Date();
          const defaultersList: any[] = [];
          
          if (appointments && Array.isArray(appointments)) {
            appointments.forEach(apt => {
              if (!apt.appointmentDate) return;
              
              const appointmentDate = new Date(apt.appointmentDate);
              if (isNaN(appointmentDate.getTime())) return;
              
              const daysDiff = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // Only include past appointments that haven't been completed
              if (daysDiff > 0 && apt.status !== 'COMPLETED') {
                const duration = this.getDurationCategory(daysDiff);
                
                defaultersList.push({
                  patientId: apt.patientId,
                  patientName: apt.patientName || 'Unknown',
                  vaccineName: apt.vaccineName,
                  doseNumber: apt.doseNumber,
                  scheduledDate: apt.appointmentDate,
                  daysOverdue: daysDiff,
                  duration: duration,
                  status: this.getStatus(daysDiff),
                  appointmentId: apt.id
                });
                
                // Update counts
                this.defaultersByDuration[duration as keyof typeof this.defaultersByDuration]++;
              }
            });
          }
          
          this.defaulters = defaultersList;
          this.totalDefaulters = defaultersList.length;
          
          // Extract unique vaccines
          this.vaccines = [...new Set(defaultersList.map(d => d.vaccineName).filter(v => v))];
          
          this.onFilterChange();
        } catch (error) {
          console.error('Error processing defaulters:', error);
          this.errorMessage = 'Error processing defaulters data.';
        } finally {
          if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = undefined;
          }
          this.loading = false;
          this.cdr.detectChanges();
}
      },
      error: (error) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = undefined;
        }
        console.error('Failed to load defaulters:', error);
        this.errorMessage = 'Failed to load defaulters. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
}
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  getDurationCategory(days: number): string {
    if (days <= 28) return '1-4 weeks';
    if (days <= 90) return '1-3 months';
    return '3+ months';
  }

  getStatus(days: number): string {
    if (days <= 28) return 'Recent';
    if (days <= 90) return 'Overdue';
    return 'Critical';
  }

  getOverdueClass(days: number): string {
    if (days <= 28) return 'overdue-recent';
    if (days <= 90) return 'overdue-warning';
    return 'overdue-critical';
  }

  onFilterChange(): void {
    const duration = this.filterForm.value.duration;
    const vaccine = this.filterForm.value.vaccine;
    
    this.filteredDefaulters = this.defaulters.filter(d => {
      const durationMatch = duration === 'all' || d.duration === duration;
      const vaccineMatch = vaccine === 'all' || d.vaccineName === vaccine;
      return durationMatch && vaccineMatch;
    });
  }

  contactPatient(defaulter: any): void {
    // TODO: Implement contact patient functionality
    console.log('Contact patient:', defaulter);
    alert(`Contact patient: ${defaulter.patientName}`);
  }

  reschedule(defaulter: any): void {
    // TODO: Implement reschedule functionality
    console.log('Reschedule appointment:', defaulter);
    alert(`Reschedule appointment for: ${defaulter.patientName}`);
  }

  exportReport(): void {
    // TODO: Implement export functionality
    console.log('Export report');
    alert('Export functionality coming soon');
  }
}
