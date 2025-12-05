import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReportingService } from '../../services/reporting.service';
import { CampaignService } from '../../services/campaign.service';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { DashboardStats } from '../../models/dashboard.model';
import { Campaign } from '../../models/campaign.model';

interface DistrictData {
  districtId: string;
  districtName: string;
  facilities: number;
  patients: number;
  vaccinations: number;
  coverage: number;
}

interface NationalStats {
  totalFacilities: number;
  totalHealthWorkers: number;
  totalPatients: number;
  totalVaccinations: number;
  nationalCoverage: number;
  activeCampaigns: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, LoadingComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  loading = false;
  nationalStats: NationalStats = {
    totalFacilities: 0,
    totalHealthWorkers: 0,
    totalPatients: 0,
    totalVaccinations: 0,
    nationalCoverage: 0,
    activeCampaigns: 0
  };

  districtData: DistrictData[] = [];
  activeCampaigns: Campaign[] = [];
  selectedView: 'national' | 'district' | 'facility' = 'national';

  constructor(
    private reportingService: ReportingService,
    private campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load national statistics (mock data for now)
    this.loadNationalStats();

    // Load district data
    this.loadDistrictData();

    // Load active campaigns
    this.campaignService.getActiveCampaigns().subscribe({
      next: (campaigns) => {
        this.activeCampaigns = campaigns;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load campaigns:', error);
        this.loading = false;
      }
    });
  }

  loadNationalStats(): void {
    // Mock data - in production, this would come from aggregated API calls
    this.nationalStats = {
      totalFacilities: 156,
      totalHealthWorkers: 842,
      totalPatients: 125430,
      totalVaccinations: 342156,
      nationalCoverage: 78.5,
      activeCampaigns: 12
    };
  }

  loadDistrictData(): void {
    // Mock data - in production, this would come from API
    this.districtData = [
      { districtId: 'D001', districtName: 'Central District', facilities: 45, patients: 35200, vaccinations: 89500, coverage: 82.3 },
      { districtId: 'D002', districtName: 'Northern District', facilities: 38, patients: 28400, vaccinations: 71200, coverage: 75.8 },
      { districtId: 'D003', districtName: 'Southern District', facilities: 42, patients: 31800, vaccinations: 78900, coverage: 79.1 },
      { districtId: 'D004', districtName: 'Eastern District', facilities: 31, patients: 30030, vaccinations: 74556, coverage: 81.2 }
    ];
  }

  getCoverageClass(coverage: number): string {
    if (coverage >= 80) return 'coverage-excellent';
    if (coverage >= 70) return 'coverage-good';
    if (coverage >= 60) return 'coverage-fair';
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

  exportNationalReport(): void {
    console.log('Exporting national report...');
  }

  onViewChange(): void {
    console.log('View changed to:', this.selectedView);
  }
}
