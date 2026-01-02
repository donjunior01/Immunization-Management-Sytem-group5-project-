import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment } from '../../../core/models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { format } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vaccinator-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './vaccinator-appointments.component.html',
  styleUrl: './vaccinator-appointments.component.scss'
})
export class VaccinatorAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  loading = false;
  errorMessage = '';
  selectedDate = format(new Date(), 'yyyy-MM-dd');
  isToday = true;
  searchQuery = '';
  appointmentFilter: 'all' | 'scheduled' | 'completed' | 'missed' = 'all';

  private isLoadingData = false;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkIfToday();
    this.loadAppointments();
  }

  checkIfToday(): void {
    const today = format(new Date(), 'yyyy-MM-dd');
    this.isToday = this.selectedDate === today;
  }

  loadAppointments(): void {
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    this.errorMessage = '';
    const startTime = Date.now();
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;

    if (!facilityId) {
      this.errorMessage = 'Facility ID is required. Please ensure you are assigned to a facility.';
      this.loading = false;
      this.isLoadingData = false;
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vaccinator-appointments.component.ts:70',message:'Loading appointments',data:{facilityId,selectedDate:this.selectedDate,hasFacilityId:!!facilityId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APPOINTMENTS_NOT_LOADING'})}).catch(()=>{});
    // #endregion
    this.appointmentService.getAppointments(facilityId, this.selectedDate).subscribe({
      next: (appointments) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vaccinator-appointments.component.ts:72',message:'Appointments received',data:{appointmentCount:appointments?.length||0,appointments:appointments?.slice(0,3).map(a=>({id:a.id,patientName:a.patientName,status:a.status,vaccineName:a.vaccineName})),rawData:JSON.stringify(appointments?.slice(0,2))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APPOINTMENTS_NOT_LOADING'})}).catch(()=>{});
        // #endregion
        this.appointments = appointments || [];
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vaccinator-appointments.component.ts:74',message:'Applying filters',data:{appointmentsCount:this.appointments.length,searchQuery:this.searchQuery,appointmentFilter:this.appointmentFilter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APPOINTMENTS_NOT_LOADING'})}).catch(()=>{});
        // #endregion
        this.applyFilters();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vaccinator-appointments.component.ts:76',message:'Filters applied',data:{filteredCount:this.filteredAppointments.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APPOINTMENTS_NOT_LOADING'})}).catch(()=>{});
        // #endregion
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load appointments:', error);
        // #region agent log
        const errorDetails = {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error,
          url: error.url
        };
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vaccinator-appointments.component.ts:80',message:'Error loading appointments',data:errorDetails,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'APPOINTMENTS_NOT_LOADING'})}).catch(()=>{});
        // #endregion
        this.appointments = [];
        this.filteredAppointments = [];
        this.errorMessage = 'Failed to load appointments. Please try again.';
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onDateChange(): void {
    this.checkIfToday();
    this.loadAppointments();
  }

  applyFilters(): void {
    let filtered = [...this.appointments];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patientName?.toLowerCase().includes(query) ||
        apt.vaccineName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (this.appointmentFilter !== 'all') {
      filtered = filtered.filter(apt => 
        apt.status?.toLowerCase() === this.appointmentFilter.toLowerCase()
      );
    }

    this.filteredAppointments = filtered;
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getAppointmentCount(): number {
    return this.appointments.length;
  }

  getScheduledCount(): number {
    return this.appointments.filter(apt => apt.status === 'SCHEDULED').length;
  }

  formatTime(time: string | undefined): string {
    if (!time) return 'All Day';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }

  formatAge(ageInMonths: number | undefined): string {
    if (!ageInMonths) return 'N/A';
    if (ageInMonths < 12) {
      return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'}`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (months === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  }

  viewPatientDetail(patientId: string): void {
    if (patientId) {
      this.router.navigate(['/vaccinator/patients/detail'], { queryParams: { patientId } });
    }
  }

  getTodayDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }
}
