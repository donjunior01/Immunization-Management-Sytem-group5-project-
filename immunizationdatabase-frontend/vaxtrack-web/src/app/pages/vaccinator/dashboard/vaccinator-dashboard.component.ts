import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientService } from '../../../core/services/patient.service';
import { StockService } from '../../../core/services/stock.service';
import { VaccinationService } from '../../../core/services/vaccination.service';
import { Router } from '@angular/router';
import { Appointment } from '../../../core/models/appointment.model';
import { StockLevel } from '../../../core/models/stock.model';
import { Patient } from '../../../core/models/patient.model';
import { AuthService } from '../../../core/services/auth.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vaccinator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './vaccinator-dashboard.component.html',
  styleUrl: './vaccinator-dashboard.component.scss'
})
export class VaccinatorDashboardComponent implements OnInit {
  // Expose format function to template
  format = format;
  todayAppointments: Appointment[] = [];
  completedToday = 0;
  totalPatients = 3450;
  vaccinationsThisWeek = 89;
  lowStockVaccines: StockLevel[] = [];
  recentPatients: Patient[] = [];
  recentVaccinations: any[] = [];
  patientSearchQuery = '';
  searchResults: Patient[] = [];
  searching = false;
  showNoResults = false;
  patientVaccinationCache: Map<string, string> = new Map(); // Cache last vaccination date
  private searchDebounceTimer: any;
  lastSyncTime = '2 min ago';
  loading = false;
  errorMessage = '';
  currentDate = format(new Date(), 'yyyy-MM-dd');
  appointmentFilter: 'all' | 'morning' | 'afternoon' | 'completed' | 'missed' = 'all';
  private isLoadingData = false; // Prevent multiple simultaneous loads

  get stockStatusText(): string {
    if (this.lowStockVaccines.length === 0) return 'Good ✓';
    if (this.lowStockVaccines.some(v => v.status === 'CRITICAL')) return 'Critical ⚠';
    return 'Low ⚠';
  }

  get stockStatusClass(): string {
    if (this.lowStockVaccines.length === 0) return 'status-good';
    if (this.lowStockVaccines.some(v => v.status === 'CRITICAL')) return 'status-critical';
    return 'status-low';
  }

  getStockCardClass(): string {
    if (this.lowStockVaccines.length === 0) return 'stat-success';
    if (this.lowStockVaccines.some(v => v.status === 'CRITICAL')) return 'stat-warning';
    return 'stat-warning';
  }

  constructor(
    private appointmentService: AppointmentService,
    private patientService: PatientService,
    private stockService: StockService,
    private vaccinationService: VaccinationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
return;
    }

    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
// Load data from backend API

    // Load appointments and stock in parallel, but ensure loading stops even if one fails
    let appointmentsLoaded = false;
    let stockLoaded = false;
    let patientsLoaded = false;
    let isComplete = false;

    const checkComplete = () => {
if (appointmentsLoaded && stockLoaded && patientsLoaded && !isComplete) {
        isComplete = true;
        clearTimeout(timeoutId); // Clear timeout since we're completing normally
ensureMinimumLoadingTime(startTime, () => {
this.loading = false;
          this.isLoadingData = false; // Reset loading flag
this.cdr.detectChanges(); // Force change detection
          // Double-check after a brief delay to ensure it's set
          setTimeout(() => {
            if (this.loading) {
              console.warn('Loader still true after callback, forcing false');
              this.loading = false;
              this.cdr.detectChanges();
            }
          }, 50);
        });
      }
    };

    // Safety timeout - ensure loader stops after 3 seconds max (reduced from 5)
    const timeoutId = setTimeout(() => {
      if (!isComplete) {
        console.warn('Dashboard loading timeout - forcing completion');
appointmentsLoaded = true;
        stockLoaded = true;
        patientsLoaded = true;
        isComplete = true;
        ensureMinimumLoadingTime(startTime, () => {
this.loading = false;
          this.isLoadingData = false; // Reset loading flag
          this.cdr.detectChanges(); // Force change detection
          // Force change detection
          setTimeout(() => {
            if (this.loading) {
              console.warn('Loader still true after timeout callback, forcing false');
              this.loading = false;
              this.cdr.detectChanges();
            }
          }, 100);
        });
      }
    }, 3000);

    // Load today's appointments (endpoint may not exist in backend)
    this.appointmentService.getAppointments(facilityId, this.currentDate).subscribe({
      next: (appointments) => {
        this.todayAppointments = appointments.filter(a => a.status === 'SCHEDULED').slice(0, 5);
        appointmentsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        // 404 or 403 means endpoint doesn't exist or user doesn't have permission
        // Fall back to mock data
        if (error.status === 404 || error.status === 403) {
          console.error('Failed to load appointments:', error);
          this.todayAppointments = [];
        } else {
          console.error('Failed to load appointments:', error);
          this.todayAppointments = [];
        }
        appointmentsLoaded = true;
        checkComplete();
      },
      complete: () => {
        // Ensure we mark as loaded even if no next/error is called
        if (!appointmentsLoaded) {
          appointmentsLoaded = true;
          checkComplete();
        }
      }
    });

    // Load stock levels
this.stockService.getStockLevels(facilityId).subscribe({
      next: (stockLevels) => {
        this.lowStockVaccines = stockLevels.filter(s =>
          s.status === 'LOW' || s.status === 'CRITICAL'
        ).slice(0, 5);
stockLoaded = true;
        checkComplete();
        clearTimeout(timeoutId);
      },
      error: (error) => {
// Log detailed error for debugging
        if (error.status === 403 || error.status === 404) {
          console.error('Failed to load stock:', error);
          this.lowStockVaccines = [];
        } else {
          console.error('Failed to load stock:', error);
          this.lowStockVaccines = [];
        }
        stockLoaded = true;
        checkComplete();
        clearTimeout(timeoutId);
      },
      complete: () => {
        // Ensure we mark as loaded even if no next/error is called
        if (!stockLoaded) {
          stockLoaded = true;
          checkComplete();
        }
        clearTimeout(timeoutId);
      }
    });

    // Load patients count and recent patients
this.patientService.searchPatients('', facilityId).subscribe({
      next: (response) => {
        this.totalPatients = response.patients?.length || 0;
        this.recentPatients = response.patients?.slice(0, 3) || [];
        patientsLoaded = true;
        checkComplete();
},
      error: (error) => {
console.error('Failed to load patients:', error);
        this.totalPatients = 0;
        this.recentPatients = [];
        patientsLoaded = true;
        checkComplete();
      },
      complete: () => {
        // Ensure we mark as loaded even if no next/error is called
        if (!patientsLoaded) {
          patientsLoaded = true;
          checkComplete();
        }
        clearTimeout(timeoutId);
      }
    });
  }

  getUserFirstName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'User';
    return user.firstName || user.fullName?.split(' ')[0] || user.username;
  }

  onPatientSearch(): void {
    // Clear previous debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    const query = this.patientSearchQuery.trim();
    
    // Don't search if query is too short
    if (query.length < 2) {
      this.searchResults = [];
      this.showNoResults = false;
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    this.searchDebounceTimer = setTimeout(() => {
      this.performQuickSearch(query);
    }, 300);
  }

  private performQuickSearch(query: string): void {
    this.searching = true;
    this.showNoResults = false;
    const user = this.authService.getCurrentUser();
    const facilityId = user?.facilityId;
this.patientService.searchPatients(query, facilityId).subscribe({
      next: (response) => {
        const allResults = response.patients || [];
        this.searchResults = allResults.slice(0, 10); // Show first 10 results
        
        // Load vaccination history for results in background
        this.loadVaccinationHistoryForPatients(this.searchResults);
        
        this.searching = false;
        this.showNoResults = this.searchResults.length === 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
console.warn('Search failed:', error);
        this.searchResults = [];
        this.searching = false;
        this.showNoResults = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadVaccinationHistoryForPatients(patients: Patient[]): void {
    // Load vaccination history for each patient in parallel (limited to avoid too many requests)
    patients.slice(0, 10).forEach(patient => {
      if (!this.patientVaccinationCache.has(patient.id)) {
        this.vaccinationService.getPatientVaccinations(patient.id).subscribe({
          next: (vaccinations) => {
            if (vaccinations && vaccinations.length > 0) {
              // Sort by date and get the most recent
              const sorted = [...vaccinations].sort((a, b) => {
                const dateA = new Date(a.administeredDate || a.date || 0).getTime();
                const dateB = new Date(b.administeredDate || b.date || 0).getTime();
                return dateB - dateA;
              });
              const lastVaccination = sorted[0];
              if (lastVaccination) {
                const date = lastVaccination.administeredDate || lastVaccination.date;
                if (date) {
                  try {
                    const formattedDate = format(new Date(date), 'dd MMM yyyy');
                    this.patientVaccinationCache.set(patient.id, formattedDate);
                  } catch {
                    this.patientVaccinationCache.set(patient.id, 'N/A');
                  }
                } else {
                  this.patientVaccinationCache.set(patient.id, 'N/A');
                }
              } else {
                this.patientVaccinationCache.set(patient.id, 'None');
              }
            } else {
              this.patientVaccinationCache.set(patient.id, 'None');
            }
            this.cdr.detectChanges();
          },
          error: () => {
            // Cache 'N/A' if failed
            this.patientVaccinationCache.set(patient.id, 'N/A');
          }
        });
      }
    });
  }

  clearSearch(): void {
    this.patientSearchQuery = '';
    this.searchResults = [];
    this.showNoResults = false;
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  selectSearchResult(patient: Patient): void {
    const patientId = patient.id || patient.patientId;
    if (patientId) {
      this.router.navigate(['/vaccinator/patients', patientId]);
      this.clearSearch();
    } else {
      console.error('Patient has no ID:', patient);
    }
  }

  getLastVaccinationDate(patient: Patient): string {
    const cached = this.patientVaccinationCache.get(patient.id);
    if (cached) {
      return cached;
    }
    return 'Loading...';
  }

  getPatientAge(appointment: Appointment): string {
    // Calculate age from appointment or patient data
    return '2 months'; // Placeholder
  }

  getPatientAgeFromDate(birthDate?: string): string {
    const date = birthDate || '';
    if (!date) return 'N/A';
    try {
      const birth = new Date(date);
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

  getPatientDisplayName(patient: Patient): string {
    return patient.fullName ||
           `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
           'Unknown Patient';
  }

  getLastVaccination(patient: Patient): string {
    // TODO: Get from patient vaccination history
    return 'BCG'; // Placeholder
  }

  getAppointmentStatusClass(status?: string): string {
    const s = (status || 'SCHEDULED').toUpperCase();
    if (s === 'COMPLETED') return 'status-completed';
    if (s === 'SCHEDULED') return 'status-scheduled';
    return 'status-pending';
  }

  getStockStatusClass(status: string): string {
    if (status === 'CRITICAL') return 'status-critical';
    if (status === 'LOW') return 'status-low';
    return 'status-good';
  }

  getStockPercentage(vaccine: StockLevel): number {
    // Calculate percentage based on total quantity
    const quantity = vaccine.totalQuantity || vaccine.currentQuantity || 0;
    if (quantity >= 100) return 100;
    if (quantity >= 50) return 75;
    if (quantity >= 20) return 50;
    if (quantity >= 10) return 25;
    return 10;
  }

  getTodayDateFormatted(): string {
    return format(new Date(), 'dd MMM yyyy');
  }
}

