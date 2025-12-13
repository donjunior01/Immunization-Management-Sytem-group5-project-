import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PatientService } from '../../services/patient.service';
import { AuthService } from '../../services/auth.service';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { Patient } from '../../models/patient.model';
import { PatientDetailsDialogComponent } from '../patient-details-dialog/patient-details-dialog.component';
import { DeleteConfirmationDialogComponent } from '../../shared/delete-confirmation-dialog/delete-confirmation-dialog.component';

@Component({
  selector: 'app-patient-list',
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
    MatDialogModule
  ],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.scss']
})
export class PatientListComponent implements OnInit {
  displayedColumns: string[] = ['id', 'fullName', 'age', 'gender', 'phoneNumber', 'guardianName', 'actions'];
  dataSource = new MatTableDataSource<Patient>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchControl = new FormControl('');
  genderFilter = new FormControl('all');

  isLoading = true;
  facilityId = '';
  totalPatients = 0;

  genderOptions = [
    { value: 'all', label: 'All Genders' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor(
    private patientService: PatientService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    const currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();

    this.loadPatients();
    this.setupSearchListener();
    this.setupGenderFilterListener();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPatients(): void {
    this.isLoading = true;

    this.patientService.getPatientsByFacility(this.facilityId).subscribe({
      next: (patients) => {
        this.dataSource.data = patients;
        this.totalPatients = patients.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.showError('Failed to load patients');
        this.isLoading = false;
      }
    });
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm || '');
      });
  }

  setupGenderFilterListener(): void {
    this.genderFilter.valueChanges.subscribe(gender => {
      this.applyGenderFilter(gender || 'all');
    });
  }

  performSearch(searchTerm: string): void {
    if (searchTerm.trim().length > 0) {
      this.isLoading = true;

      this.patientService.searchPatients(this.facilityId, searchTerm).subscribe({
        next: (patients) => {
          this.dataSource.data = patients;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching patients:', error);
          this.showError('Search failed');
          this.isLoading = false;
        }
      });
    } else {
      this.loadPatients();
    }
  }

  applyGenderFilter(gender: string): void {
    if (gender === 'all') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (data: Patient, filter: string) => {
        return data.gender === filter;
      };
      this.dataSource.filter = gender;
    }
  }

  viewPatient(patient: Patient): void {
    this.loaderService.show(); // Show loader for 1000ms
    
    setTimeout(() => {
      const dialogRef = this.dialog.open(PatientDetailsDialogComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: patient,
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.action === 'edit') {
          this.editPatient(patient);
        }
      });
    }, 1000);
  }

  editPatient(patient: Patient): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      // Navigate to edit patient form
      this.router.navigate(['/patients/edit', patient.id]);
    }, 1000);
  }

  deletePatient(patient: Patient): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Delete Patient',
        message: 'Are you sure you want to delete this patient?',
        entityName: patient.fullName
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loaderService.show(); // Show loader for 1000ms
        
        this.patientService.deletePatient(patient.id).subscribe({
          next: () => {
            this.notificationService.success(`Patient "${patient.fullName}" deleted successfully`);
            setTimeout(() => {
              this.loadPatients(); // Reload the list
            }, 1000);
          },
          error: (error) => {
            console.error('Error deleting patient:', error);
            this.notificationService.error('Failed to delete patient');
          }
        });
      }
    });
  }

  registerNewPatient(): void {
    this.loaderService.show(); // Show loader for 1000ms
    setTimeout(() => {
      this.router.navigate(['/patients/register']);
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
      link.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success(`Exported ${this.dataSource.data.length} patients to CSV`);
    }, 1000);
  }

  private convertToCSV(data: Patient[]): string {
    const headers = ['ID', 'Full Name', 'Age', 'Gender', 'Phone Number', 'Guardian Name', 'Date of Birth', 'Address'];
    const rows = data.map(patient => [
      patient.id,
      patient.fullName,
      patient.age,
      patient.gender,
      patient.phoneNumber || 'N/A',
      patient.guardianName,
      patient.dateOfBirth,
      patient.address || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.genderFilter.setValue('all');
    this.loadPatients();
  }

  getGenderLabel(gender: string): string {
    const option = this.genderOptions.find(opt => opt.value === gender);
    return option?.label || gender;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
