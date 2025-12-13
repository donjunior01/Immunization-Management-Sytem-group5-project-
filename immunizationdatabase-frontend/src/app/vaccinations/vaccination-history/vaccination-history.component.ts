import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { VaccinationRealService, VaccinationResponse } from '../../services/vaccination-real.service';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { Patient } from '../../models/patient.model';

@Component({
  selector: 'app-vaccination-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  templateUrl: './vaccination-history.component.html',
  styleUrls: ['./vaccination-history.component.scss']
})
export class VaccinationHistoryComponent implements OnInit {
  displayedColumns: string[] = ['vaccinationDate', 'vaccineName', 'doseNumber', 'batchNumber', 'administeredBy', 'actions'];
  dataSource = new MatTableDataSource<VaccinationResponse>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Filters
  patientSearchControl = new FormControl('');
  vaccineTypeControl = new FormControl('all');
  startDateControl = new FormControl('');
  endDateControl = new FormControl('');

  filteredPatients!: Observable<Patient[]>;
  selectedPatient: Patient | null = null;

  isLoading = true;
  facilityId = '';
  totalVaccinations = 0;

  vaccineTypes = [
    { value: 'all', label: 'All Vaccines' },
    { value: 'BCG', label: 'BCG' },
    { value: 'Polio', label: 'Polio' },
    { value: 'DTP', label: 'DTP' },
    { value: 'Hepatitis B', label: 'Hepatitis B' },
    { value: 'Measles', label: 'Measles' },
    { value: 'Rotavirus', label: 'Rotavirus' },
    { value: 'Pneumococcal', label: 'Pneumococcal' }
  ];

  constructor(
    private vaccinationService: VaccinationRealService,
    private patientService: PatientService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    const currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();

    // Check if patient ID is provided in route
    const patientId = this.route.snapshot.queryParamMap.get('patientId');
    if (patientId) {
      this.loadPatientVaccinations(patientId);
    } else {
      this.loadFacilityVaccinations();
    }

    this.setupPatientAutocomplete();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupPatientAutocomplete(): void {
    this.filteredPatients = this.patientSearchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.patientService.searchPatients(this.facilityId, value);
        }
        return [];
      })
    );
  }

  setupFilters(): void {
    this.vaccineTypeControl.valueChanges.subscribe(() => this.applyFilters());
    this.startDateControl.valueChanges.subscribe(() => this.applyFilters());
    this.endDateControl.valueChanges.subscribe(() => this.applyFilters());
  }

  loadFacilityVaccinations(): void {
    this.isLoading = true;

    this.vaccinationService.getVaccinationsByFacility(this.facilityId).subscribe({
      next: (vaccinations) => {
        this.dataSource.data = vaccinations;
        this.totalVaccinations = vaccinations.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vaccinations:', error);
        this.notificationService.error('Failed to load vaccination history');
        this.isLoading = false;
      }
    });
  }

  loadPatientVaccinations(patientId: string): void {
    this.isLoading = true;

    // First, load patient details
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.selectedPatient = patient;
        this.patientSearchControl.setValue(`${patient.fullName} (ID: ${patient.id})`);

        // Then load vaccination history
        this.vaccinationService.getVaccinationHistory(patientId).subscribe({
          next: (vaccinations) => {
            this.dataSource.data = vaccinations;
            this.totalVaccinations = vaccinations.length;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading vaccination history:', error);
            this.notificationService.error('Failed to load vaccination history');
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading patient:', error);
        this.notificationService.error('Failed to load patient details');
        this.isLoading = false;
      }
    });
  }

  onPatientSelected(patient: Patient): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.selectedPatient = patient;
    this.patientSearchControl.setValue(`${patient.fullName} (ID: ${patient.id})`);
    setTimeout(() => {
      this.loadPatientVaccinations(patient.id);
    }, 1000);
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.fullName} (ID: ${patient.id})` : '';
  }

  applyFilters(): void {
    let filteredData = [...this.dataSource.data];

    // Filter by vaccine type
    const vaccineType = this.vaccineTypeControl.value;
    if (vaccineType && vaccineType !== 'all') {
      filteredData = filteredData.filter(v =>
        v.vaccineName.toLowerCase().includes(vaccineType.toLowerCase())
      );
    }

    // Filter by date range
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    if (startDate) {
      const start = new Date(startDate);
      filteredData = filteredData.filter(v =>
        new Date(v.dateAdministered) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      filteredData = filteredData.filter(v =>
        new Date(v.dateAdministered) <= end
      );
    }

    this.dataSource.data = filteredData;
  }

  clearFilters(): void {
    this.patientSearchControl.setValue('');
    this.vaccineTypeControl.setValue('all');
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.selectedPatient = null;
    this.loadFacilityVaccinations();
  }

  viewVaccinationDetails(vaccination: VaccinationResponse): void {
    // TODO: Navigate to vaccination details view
    console.log('View vaccination details:', vaccination);
  }

  printVaccinationCard(vaccination: VaccinationResponse): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.router.navigate(['/vaccinations/print', vaccination.patientId]);
    }, 1000);
  }

  exportToCSV(): void {
    this.loaderService.show(); // Show loader for 1000ms
    
    setTimeout(() => {
      const csvData = this.convertToCSV(this.dataSource.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vaccination_history_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success(`Exported ${this.dataSource.data.length} vaccination records to CSV`);
    }, 1000);
  }

  private convertToCSV(data: VaccinationResponse[]): string {
    const headers = ['Date', 'Patient Name', 'Patient ID', 'Vaccine Name', 'Dose Number', 'Batch Number', 'Administered By', 'Notes'];
    const rows = data.map(record => [
      new Date(record.dateAdministered).toLocaleDateString(),
      record.patientName || 'Unknown',
      record.patientId,
      record.vaccineName,
      record.doseNumber,
      record.batchNumber || `Batch ${record.batchId}`,
      `Nurse ${record.nurseId}`,
      record.notes || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  refreshData(): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.notificationService.info('Refreshing vaccination history...');
    
    setTimeout(() => {
      if (this.selectedPatient) {
        this.loadPatientVaccinations(this.selectedPatient.id);
      } else {
        this.loadFacilityVaccinations();
      }
      this.notificationService.success('Vaccination history refreshed');
    }, 1000);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
