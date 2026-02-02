import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../../shared/components/layout/layout.component';
import { PatientService } from '../../../../core/services/patient.service';
import { Patient } from '../../../../core/models/patient.model';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { environment } from '../../../../../environments/environment';
import { ensureMinimumLoadingTime } from '../../../../core/utils/loading.util';

@Component({
  selector: 'app-patient-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent],
  templateUrl: './patient-search.component.html',
  styleUrl: './patient-search.component.scss'
})
export class PatientSearchComponent implements OnInit {
  patients: Patient[] = [];
  searchQuery = '';
  loading = false;
  errorMessage = '';
  showAdvancedFilters = false;
  viewMode: 'list' | 'grid' = 'list';
  private searchDebounceTimer: any;
  
  // Advanced filters
  ageMin = '';
  ageMax = '';
  genderFilter: 'all' | 'MALE' | 'FEMALE' = 'all';
  villageFilter = '';
  vaccinationStatusFilter = 'all';
  villages: string[] = [];
  offlineMode = false;

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.navigator) {
      this.offlineMode = !window.navigator.onLine;
    }
    this.loadVillages();
    
    // Auto-search as user types (debounced)
    // Note: In production, you'd want to debounce this properly
  }

  loadVillages(): void {
    // Load unique villages for filter dropdown
    // Try API first, fallback to mock data on error
    this.patientService.searchPatients('').subscribe({
      next: (response) => {
        this.villages = [...new Set((response.patients || []).map(p => p.village || p.address).filter((v): v is string => Boolean(v)))];
      },
      error: () => {
        // If API fails, villages will remain empty
        this.villages = [];
      }
    });
  }

  onSearch(): void {
    // Clear previous debounce timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Debounce search - wait 300ms after user stops typing
    this.searchDebounceTimer = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  private performSearch(): void {
    if (this.searchQuery.trim() || this.hasActiveFilters()) {
      this.loading = true;
      if (typeof window !== 'undefined' && window.navigator) {
        this.offlineMode = !window.navigator.onLine;
      }
      const startTime = Date.now();
      
      // Always try real API first, fallback to mock data on error
      // Use new search format: ?q={query}
      this.patientService.searchPatients(this.searchQuery.trim()).subscribe({
        next: (response) => {
          let results = response.patients || [];
          
          // Apply filters
          results = this.applyFilters(results);
          
          // Limit to 50 results per page (as per requirements)
          if (results.length > 50) {
            results = results.slice(0, 50);
          }
          
          this.patients = results;
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
          });
        },
        error: (error) => {
          console.error('Search API error:', error);
          this.patients = [];
          this.errorMessage = error.error?.message || 'Failed to search patients. Please try again.';
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
          });
        }
      });
    } else {
      // Clear results if search query is empty
      this.patients = [];
      this.loading = false;
    }
  }

  applyFilters(patients: Patient[]): Patient[] {
    return patients.filter(patient => {
      // Age filter
      if (this.ageMin || this.ageMax) {
        const ageMonths = this.getPatientAgeMonths(patient.birthDate || patient.dateOfBirth || '');
        if (this.ageMin && ageMonths < parseInt(this.ageMin)) return false;
        if (this.ageMax && ageMonths > parseInt(this.ageMax)) return false;
      }

      // Gender filter
      if (this.genderFilter !== 'all' && patient.gender !== this.genderFilter) {
        return false;
      }

      // Village filter
      if (this.villageFilter && patient.village !== this.villageFilter) {
        return false;
      }

      return true;
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.ageMin || this.ageMax || this.genderFilter !== 'all' || this.villageFilter);
  }

  clearFilters(): void {
    this.ageMin = '';
    this.ageMax = '';
    this.genderFilter = 'all';
    this.villageFilter = '';
    this.vaccinationStatusFilter = 'all';
    this.onSearch();
  }

  getPatientAge(birthDate?: string): string {
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

  getPatientAgeMonths(birthDate?: string): number {
    if (!birthDate) return 0;
    try {
      return differenceInMonths(new Date(), new Date(birthDate));
    } catch {
      return 0;
    }
  }

  getPatientDisplayName(patient: Patient): string {
    return patient.fullName || 
           `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 
           'Unknown Patient';
  }

  viewPatient(patient: Patient): void {
    this.router.navigate(['/vaccinator/patients', patient.id]);
  }

  recordVaccination(patient: Patient): void {
    this.router.navigate(['/vaccinator/vaccinations/record'], {
      queryParams: { patientId: patient.id }
    });
  }

  getVaccinationStatus(patient: Patient): string {
    // TODO: Calculate based on vaccination history
    return 'Up to date';
  }

  getStatusClass(status: string): string {
    if (status.includes('Up to date')) return 'status-good';
    if (status.includes('Due')) return 'status-warning';
    return 'status-error';
  }
}

