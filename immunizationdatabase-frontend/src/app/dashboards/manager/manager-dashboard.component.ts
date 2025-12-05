import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReportingService } from '../../services/reporting.service';
import { CampaignService } from '../../services/campaign.service';
import { VaccinationService } from '../../services/vaccination.service';
import { PatientService } from '../../services/patient.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { DashboardStats } from '../../models/dashboard.model';
import { Campaign } from '../../models/campaign.model';

interface CoverageData {
  vaccineName: string;
  administered: number;
  target: number;
  percentage: number;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, LoadingComponent],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent implements OnInit {
  loading = false;
  facilityId: string = 'FAC001'; // TODO: Get from auth service
  stats: DashboardStats | null = null;
  activeCampaigns: Campaign[] = [];
  coverageData: CoverageData[] = [];

  // Filters
  selectedPeriod: 'week' | 'month' | 'year' = 'month';

  constructor(
    private reportingService: ReportingService,
    private campaignService: CampaignService,
    private vaccinationService: VaccinationService,
    private patientService: PatientService
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

    // Load active campaigns
    this.campaignService.getActiveCampaigns().subscribe({
      next: (campaigns) => {
        this.activeCampaigns = campaigns.filter(c => c.facilityId === this.facilityId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load campaigns:', error);
        this.loading = false;
      }
    });

    // Load coverage data
    this.loadCoverageData();
  }

  loadCoverageData(): void {
    // Mock coverage data - in production, this would come from an API
    this.coverageData = [
      { vaccineName: 'BCG', administered: 850, target: 1000, percentage: 85 },
      { vaccineName: 'Polio', administered: 920, target: 1000, percentage: 92 },
      { vaccineName: 'Measles', administered: 780, target: 1000, percentage: 78 },
      { vaccineName: 'COVID-19', administered: 1200, target: 1500, percentage: 80 },
      { vaccineName: 'Hepatitis B', administered: 650, target: 800, percentage: 81 }
    ];
  }

  getCoverageClass(percentage: number): string {
    if (percentage >= 90) return 'coverage-excellent';
    if (percentage >= 75) return 'coverage-good';
    if (percentage >= 50) return 'coverage-fair';
    return 'coverage-poor';
  }

  getCampaignStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-success';
      case 'PLANNED': return 'badge-info';
      case 'COMPLETED': return 'badge-secondary';
      case 'CANCELLED': return 'badge-danger';
      default: return 'badge-info';
    }
  }

  getDaysRemaining(endDate: string | Date): number {
    const today = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  exportReport(): void {
    // TODO: Implement report export functionality
    console.log('Exporting report...');
  }

  onPeriodChange(): void {
    this.loadCoverageData();
  }
}
