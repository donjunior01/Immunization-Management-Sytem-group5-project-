import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { DefaulterDetailsDialogComponent } from '../defaulter-details-dialog/defaulter-details-dialog.component';
import { ReminderConfirmationDialogComponent } from '../../shared/reminder-confirmation-dialog/reminder-confirmation-dialog.component';

interface DefaulterRecord {
  patientId: string;
  patientName: string;
  age: number;
  guardianName: string;
  phoneNumber: string;
  missedVaccine: string;
  dueDate: string;
  daysOverdue: number;
  urgency: 'critical' | 'high' | 'medium';
}

@Component({
  selector: 'app-defaulters-list',
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
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './defaulters-list.component.html',
  styleUrls: ['./defaulters-list.component.scss']
})
export class DefaultersListComponent implements OnInit {
  displayedColumns: string[] = ['patientName', 'age', 'guardianName', 'phoneNumber', 'missedVaccine', 'dueDate', 'daysOverdue', 'urgency', 'actions'];
  dataSource = new MatTableDataSource<DefaulterRecord>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  searchControl = new FormControl('');
  urgencyFilter = new FormControl('all');

  isLoading = true;
  facilityId = '';
  totalDefaulters = 0;

  urgencyOptions = [
    { value: 'all', label: 'All Urgency Levels' },
    { value: 'critical', label: 'Critical (>60 days)' },
    { value: 'high', label: 'High (30-60 days)' },
    { value: 'medium', label: 'Medium (<30 days)' }
  ];

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private loaderService: LoaderService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loaderService.show(); // Show loader for 1000ms
    const currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();

    this.loadDefaulters();
    this.setupFilters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDefaulters(): void {
    this.isLoading = true;

    // TODO: Replace with actual backend API call
    // For now, using mock data to demonstrate functionality
    // Backend endpoint: GET /api/defaulters?facilityId={facilityId}

    setTimeout(() => {
      const mockDefaulters: DefaulterRecord[] = [
        {
          patientId: 'P001',
          patientName: 'John Doe',
          age: 2,
          guardianName: 'Jane Doe',
          phoneNumber: '1234567890',
          missedVaccine: 'Measles (Dose 2)',
          dueDate: '2024-11-15',
          daysOverdue: 75,
          urgency: 'critical'
        },
        {
          patientId: 'P002',
          patientName: 'Alice Smith',
          age: 1,
          guardianName: 'Bob Smith',
          phoneNumber: '9876543210',
          missedVaccine: 'Polio (Dose 3)',
          dueDate: '2024-12-20',
          daysOverdue: 40,
          urgency: 'high'
        },
        {
          patientId: 'P003',
          patientName: 'Emily Johnson',
          age: 3,
          guardianName: 'Michael Johnson',
          phoneNumber: '5551234567',
          missedVaccine: 'DTP (Booster)',
          dueDate: '2025-01-10',
          daysOverdue: 19,
          urgency: 'medium'
        },
        {
          patientId: 'P004',
          patientName: 'David Brown',
          age: 2,
          guardianName: 'Sarah Brown',
          phoneNumber: '5559876543',
          missedVaccine: 'Hepatitis B (Dose 3)',
          dueDate: '2024-10-30',
          daysOverdue: 91,
          urgency: 'critical'
        },
        {
          patientId: 'P005',
          patientName: 'Sophia Wilson',
          age: 1,
          guardianName: 'James Wilson',
          phoneNumber: '5556781234',
          missedVaccine: 'Rotavirus (Dose 2)',
          dueDate: '2024-12-05',
          daysOverdue: 55,
          urgency: 'high'
        }
      ];

      this.dataSource.data = mockDefaulters;
      this.totalDefaulters = mockDefaulters.length;
      this.isLoading = false;
    }, 1000);
  }

  setupFilters(): void {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.dataSource.filter = searchTerm?.trim().toLowerCase() || '';
    });

    this.urgencyFilter.valueChanges.subscribe(urgency => {
      this.applyUrgencyFilter(urgency || 'all');
    });

    // Custom filter predicate for search
    this.dataSource.filterPredicate = (data: DefaulterRecord, filter: string) => {
      return data.patientName.toLowerCase().includes(filter) ||
             data.guardianName.toLowerCase().includes(filter) ||
             data.phoneNumber.includes(filter) ||
             data.missedVaccine.toLowerCase().includes(filter);
    };
  }

  applyUrgencyFilter(urgency: string): void {
    if (urgency === 'all') {
      this.dataSource.filter = this.searchControl.value?.trim().toLowerCase() || '';
    } else {
      this.dataSource.filterPredicate = (data: DefaulterRecord, filter: string) => {
        const matchesSearch = this.searchControl.value
          ? (data.patientName.toLowerCase().includes(this.searchControl.value.toLowerCase()) ||
             data.guardianName.toLowerCase().includes(this.searchControl.value.toLowerCase()) ||
             data.phoneNumber.includes(this.searchControl.value) ||
             data.missedVaccine.toLowerCase().includes(this.searchControl.value.toLowerCase()))
          : true;

        return matchesSearch && data.urgency === urgency;
      };
      this.dataSource.filter = 'urgency_filter_' + urgency;
    }
  }

  sendReminder(defaulter: DefaulterRecord): void {
    const dialogRef = this.dialog.open(ReminderConfirmationDialogComponent, {
      width: '600px',
      data: {
        patientName: defaulter.patientName,
        guardianName: defaulter.guardianName,
        phoneNumber: defaulter.phoneNumber,
        missedVaccine: defaulter.missedVaccine
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loaderService.show(); // Show loader for 1000ms
        this.notificationService.info(`Sending reminder to ${defaulter.guardianName}...`);

        // TODO: Replace with actual backend API call
        // Backend endpoint: POST /api/reminders
        setTimeout(() => {
          this.notificationService.success(
            `Reminder sent successfully to ${defaulter.guardianName} at ${defaulter.phoneNumber}`
          );
        }, 1000);
      }
    });
  }

  scheduleFollowUp(defaulter: DefaulterRecord): void {
    this.loaderService.show(); // Show loader for 1000ms
    
    setTimeout(() => {
      // TODO: Navigate to scheduling component or open scheduling dialog
      this.notificationService.info(`Follow-up scheduled for ${defaulter.patientName}`);
    }, 1000);
  }

  viewPatientDetails(defaulter: DefaulterRecord): void {
    this.loaderService.show(); // Show loader for 1000ms

    setTimeout(() => {
      const dialogRef = this.dialog.open(DefaulterDetailsDialogComponent, {
        width: '800px',
        maxWidth: '90vw',
        data: defaulter,
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (result.action === 'send-reminder') {
            this.sendReminder(defaulter);
          } else if (result.action === 'schedule-followup') {
            this.scheduleFollowUp(defaulter);
          }
        }
      });
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
      link.download = `defaulters_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success(`Exported ${this.dataSource.data.length} defaulter records to CSV`);
    }, 1000);
  }

  private convertToCSV(data: DefaulterRecord[]): string {
    const headers = ['Patient ID', 'Patient Name', 'Age', 'Guardian Name', 'Phone Number', 'Missed Vaccine', 'Due Date', 'Days Overdue', 'Urgency'];
    const rows = data.map(record => [
      record.patientId,
      record.patientName,
      record.age,
      record.guardianName,
      record.phoneNumber,
      record.missedVaccine,
      record.dueDate,
      record.daysOverdue,
      record.urgency.toUpperCase()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.urgencyFilter.setValue('all');
  }

  getUrgencyClass(urgency: string): string {
    return urgency;
  }

  getUrgencyIcon(urgency: string): string {
    const icons: { [key: string]: string } = {
      critical: 'error',
      high: 'warning',
      medium: 'info'
    };
    return icons[urgency] || 'info';
  }

  refreshData(): void {
    this.loaderService.show(); // Show loader for 1000ms
    this.notificationService.info('Refreshing defaulters list...');
    
    setTimeout(() => {
      this.loadDefaulters();
      this.notificationService.success('Defaulters list refreshed');
    }, 1000);
  }
}
