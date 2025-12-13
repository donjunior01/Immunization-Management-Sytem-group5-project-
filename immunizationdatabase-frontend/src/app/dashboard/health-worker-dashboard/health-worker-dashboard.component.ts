import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReportingService } from '../../services/reporting.service';
import { InventoryRealService } from '../../services/inventory-real.service';
import { VaccinationRealService } from '../../services/vaccination-real.service';

interface DashboardStats {
  totalPatientsRegistered: number;
  vaccinationsToday: number;
  defaulters: number;
  lowStockVaccines: number;
}

interface StockAlert {
  vaccineName: string;
  currentStock: number;
  minRequired: number;
  expiryDate: string;
  status: 'critical' | 'warning' | 'good';
}

interface RecentVaccination {
  patientName: string;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  batchNumber: string;
}

@Component({
  selector: 'app-health-worker-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTableModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './health-worker-dashboard.component.html',
  styleUrls: ['./health-worker-dashboard.component.scss']
})
export class HealthWorkerDashboardComponent implements OnInit {
  currentUser: any;
  stats: DashboardStats = {
    totalPatientsRegistered: 0,
    vaccinationsToday: 0,
    defaulters: 0,
    lowStockVaccines: 0
  };

  stockAlerts: StockAlert[] = [];
  recentVaccinations: RecentVaccination[] = [];
  displayedColumns: string[] = ['patientName', 'vaccineName', 'doseNumber', 'date', 'actions'];
  isLoading = true;
  facilityId: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private reportingService: ReportingService,
    private inventoryService: InventoryRealService,
    private vaccinationService: VaccinationRealService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.facilityId = this.authService.getFacilityId();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadStats();
    this.loadStockAlerts();
    this.loadRecentVaccinations();
  }

  loadStats(): void {
    this.reportingService.getDashboardStats(this.facilityId).subscribe({
      next: (data) => {
        this.stats = {
          totalPatientsRegistered: Number(data.totalPatients || 0),
          vaccinationsToday: Number(data.vaccinationsThisMonth || 0),
          defaulters: 0, // TODO: Add defaulters endpoint
          lowStockVaccines: Number(data.expiringBatches || 0)
        };
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.showError('Failed to load dashboard statistics');
      }
    });
  }

  loadStockAlerts(): void {
    this.inventoryService.getExpiringSoonBatches(this.facilityId).subscribe({
      next: (batches) => {
        if (Array.isArray(batches) && batches.length > 0) {
          this.stockAlerts = batches
            .filter(batch => batch.quantityRemaining < 1000 || batch.isExpiringSoon)
            .map(batch => ({
              vaccineName: batch.vaccineName,
              currentStock: batch.quantityRemaining,
              minRequired: 1000,
              expiryDate: batch.expiryDate,
              status: (batch.quantityRemaining < 300 ? 'critical' : 'warning') as 'critical' | 'warning' | 'good'
            }))
            .slice(0, 5);
        } else {
          this.stockAlerts = [];
        }
      },
      error: (error) => {
        console.error('Error loading stock alerts:', error);
        this.stockAlerts = [];
        this.showError('Failed to load stock alerts');
      }
    });
  }

  loadRecentVaccinations(): void {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString().split('T')[0];

    this.vaccinationService.getVaccinationsByDateRange(this.facilityId, startOfDay, endOfDay).subscribe({
      next: (vaccinations) => {
        this.recentVaccinations = vaccinations.slice(0, 5).map(v => ({
          patientName: v.patientName || 'Unknown',
          vaccineName: v.vaccineName,
          doseNumber: v.doseNumber,
          dateAdministered: new Date(v.dateAdministered).toLocaleString(),
          batchNumber: `BATCH-${v.batchId}`
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading recent vaccinations:', error);
        this.showError('Failed to load recent vaccinations');
        this.isLoading = false;
      }
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  getStockStatusClass(status: string): string {
    switch (status) {
      case 'critical':
        return 'status-critical';
      case 'warning':
        return 'status-warning';
      default:
        return 'status-good';
    }
  }

  getStockPercentage(alert: StockAlert): number {
    return (alert.currentStock / alert.minRequired) * 100;
  }

  navigateToRegisterPatient(): void {
    this.router.navigate(['/patients/register']);
  }

  navigateToRecordVaccination(): void {
    this.router.navigate(['/vaccinations/record']);
  }

  navigateToDefaulters(): void {
    this.router.navigate(['/patients/defaulters']);
  }

  navigateToStockManagement(): void {
    this.router.navigate(['/inventory/stock']);
  }

  viewPatientRecord(vaccination: RecentVaccination): void {
    // TODO: Navigate to patient detail page
    console.log('View patient:', vaccination.patientName);
  }

  printVaccinationCard(vaccination: RecentVaccination): void {
    // TODO: Implement print functionality
    console.log('Print card for:', vaccination.patientName);
  }
}
