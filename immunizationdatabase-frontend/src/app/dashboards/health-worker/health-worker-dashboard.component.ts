import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReportingService } from '../../services/reporting.service';
import { PatientService } from '../../services/patient.service';
import { VaccinationService } from '../../services/vaccination.service';
import { InventoryService } from '../../services/inventory.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { DashboardStats } from '../../models/dashboard.model';
import { Patient } from '../../models/patient.model';
import { VaccineBatch } from '../../models/vaccine-batch.model';

@Component({
  selector: 'app-health-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, LoadingComponent],
  templateUrl: './health-worker-dashboard.component.html',
  styleUrls: ['./health-worker-dashboard.component.scss']
})
export class HealthWorkerDashboardComponent implements OnInit {
  loading = false;
  facilityId: string = 'FAC001'; // TODO: Get from auth service
  stats: DashboardStats | null = null;
  recentPatients: Patient[] = [];
  expiringBatches: any[] = [];

  // Quick Actions
  showQuickAddPatient = false;
  showQuickVaccination = false;

  constructor(
    private reportingService: ReportingService,
    private patientService: PatientService,
    private vaccinationService: VaccinationService,
    private inventoryService: InventoryService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load dashboard stats
    this.reportingService.getDashboardStats(this.facilityId).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
      }
    });

    // Load recent patients
    this.patientService.getPatientsByFacility(this.facilityId).subscribe({
      next: (patients) => {
        this.recentPatients = patients.slice(0, 5); // Show last 5
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load patients:', error);
        this.loading = false;
      }
    });

    // Load expiring batches
    this.inventoryService.getExpiringBatches(30).subscribe({
      next: (batches: any) => {
        this.expiringBatches = batches;
      },
      error: (error: any) => {
        console.error('Failed to load expiring batches:', error);
      }
    });
  }

  openQuickAddPatient(): void {
    this.showQuickAddPatient = true;
  }

  openQuickVaccination(): void {
    this.showQuickVaccination = true;
  }

  getExpiryStatus(expiryDate: string | Date): string {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 7) return `${daysUntilExpiry} days`;
    if (daysUntilExpiry <= 30) return `${daysUntilExpiry} days`;
    return 'OK';
  }

  getExpiryClass(expiryDate: string | Date): string {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'badge-danger';
    if (daysUntilExpiry <= 7) return 'badge-danger';
    if (daysUntilExpiry <= 30) return 'badge-warning';
    return 'badge-success';
  }
}
