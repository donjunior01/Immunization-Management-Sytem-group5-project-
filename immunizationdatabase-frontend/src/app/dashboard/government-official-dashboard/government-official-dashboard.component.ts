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
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReportingService } from '../../services/reporting.service';
import { CampaignService } from '../../services/campaign.service';
import { InventoryRealService } from '../../services/inventory-real.service';
import { StatisticsService, NationalStatistics } from '../../services/statistics.service';

interface NationalStats {
  totalDistricts: number;
  totalFacilities: number;
  totalPatientsRegistered: number;
  totalVaccinationsThisMonth: number;
  nationalCoverageRate: number;
  activeCampaigns: number;
  completedCampaignsThisYear: number;
  totalVaccineStock: number;
}

interface DistrictPerformance {
  districtName: string;
  facilities: number;
  population: number;
  registered: number;
  vaccinated: number;
  coverageRate: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  stockStatus: 'optimal' | 'low' | 'critical';
}

interface CampaignOverview {
  id: string;
  campaignName: string;
  targetDistricts: string[];
  totalTargetPopulation: number;
  totalVaccinated: number;
  coveragePercent: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planned';
  budget: number;
  spent: number;
}

interface VaccineStockByDistrict {
  districtName: string;
  totalStock: number;
  distributed: number;
  remaining: number;
  expiringIn30Days: number;
  stockoutRisk: 'low' | 'medium' | 'high';
  lastRestockDate: string;
}

interface CoverageByVaccine {
  vaccineName: string;
  targetDoses: number;
  administeredDoses: number;
  coveragePercent: number;
  defaulters: number;
  stockAvailability: number;
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-government-official-dashboard',
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
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './government-official-dashboard.component.html',
  styleUrls: ['./government-official-dashboard.component.scss']
})
export class GovernmentOfficialDashboardComponent implements OnInit {
  currentUser: any;
  selectedTimeRange = 'month';
  isLoading = true;
  facilityId: string = '';

  stats: NationalStats = {
    totalDistricts: 0,
    totalFacilities: 0,
    totalPatientsRegistered: 0,
    totalVaccinationsThisMonth: 0,
    nationalCoverageRate: 0,
    activeCampaigns: 0,
    completedCampaignsThisYear: 0,
    totalVaccineStock: 0
  };

  districtPerformance: DistrictPerformance[] = [
    {
      districtName: 'Nairobi Central',
      facilities: 8,
      population: 12000,
      registered: 11500,
      vaccinated: 10800,
      coverageRate: 93.9,
      rank: 1,
      trend: 'up',
      stockStatus: 'optimal'
    },
    {
      districtName: 'Nairobi West',
      facilities: 6,
      population: 9500,
      registered: 8700,
      vaccinated: 7800,
      coverageRate: 89.7,
      rank: 2,
      trend: 'up',
      stockStatus: 'optimal'
    },
    {
      districtName: 'Nairobi East',
      facilities: 7,
      population: 11000,
      registered: 9200,
      vaccinated: 7600,
      coverageRate: 82.6,
      rank: 3,
      trend: 'stable',
      stockStatus: 'low'
    },
    {
      districtName: 'Nairobi North',
      facilities: 5,
      population: 7800,
      registered: 6500,
      vaccinated: 5200,
      coverageRate: 80.0,
      rank: 4,
      trend: 'down',
      stockStatus: 'low'
    },
    {
      districtName: 'Nairobi South',
      facilities: 6,
      population: 8200,
      registered: 6800,
      vaccinated: 5100,
      coverageRate: 75.0,
      rank: 5,
      trend: 'stable',
      stockStatus: 'critical'
    }
  ];

  campaignOverviews: CampaignOverview[] = [
    {
      id: 'NC001',
      campaignName: 'National Measles Eradication Campaign 2025',
      targetDistricts: ['Nairobi Central', 'Nairobi West', 'Nairobi East'],
      totalTargetPopulation: 32500,
      totalVaccinated: 28750,
      coveragePercent: 88.5,
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      status: 'active',
      budget: 5000000,
      spent: 4200000
    },
    {
      id: 'NC002',
      campaignName: 'Polio Immunization Drive',
      targetDistricts: ['All Districts'],
      totalTargetPopulation: 52430,
      totalVaccinated: 45820,
      coveragePercent: 87.4,
      startDate: '2025-10-15',
      endDate: '2025-12-15',
      status: 'active',
      budget: 8000000,
      spent: 6500000
    },
    {
      id: 'NC003',
      campaignName: 'BCG Vaccination Initiative',
      targetDistricts: ['Nairobi North', 'Nairobi South'],
      totalTargetPopulation: 16000,
      totalVaccinated: 16000,
      coveragePercent: 100.0,
      startDate: '2025-09-01',
      endDate: '2025-10-31',
      status: 'completed',
      budget: 3000000,
      spent: 2850000
    }
  ];

  vaccineStockByDistrict: VaccineStockByDistrict[] = [
    {
      districtName: 'Nairobi Central',
      totalStock: 45000,
      distributed: 32000,
      remaining: 13000,
      expiringIn30Days: 150,
      stockoutRisk: 'low',
      lastRestockDate: '2025-11-28'
    },
    {
      districtName: 'Nairobi West',
      totalStock: 32000,
      distributed: 24000,
      remaining: 8000,
      expiringIn30Days: 200,
      stockoutRisk: 'medium',
      lastRestockDate: '2025-11-25'
    },
    {
      districtName: 'Nairobi East',
      totalStock: 28000,
      distributed: 22000,
      remaining: 6000,
      expiringIn30Days: 180,
      stockoutRisk: 'medium',
      lastRestockDate: '2025-11-20'
    },
    {
      districtName: 'Nairobi North',
      totalStock: 18000,
      distributed: 14500,
      remaining: 3500,
      expiringIn30Days: 120,
      stockoutRisk: 'high',
      lastRestockDate: '2025-11-15'
    },
    {
      districtName: 'Nairobi South',
      totalStock: 15000,
      distributed: 12800,
      remaining: 2200,
      expiringIn30Days: 90,
      stockoutRisk: 'high',
      lastRestockDate: '2025-11-10'
    }
  ];

  coverageByVaccine: CoverageByVaccine[] = [
    {
      vaccineName: 'BCG',
      targetDoses: 52430,
      administeredDoses: 49850,
      coveragePercent: 95.1,
      defaulters: 2580,
      stockAvailability: 85000,
      trend: 'up'
    },
    {
      vaccineName: 'Polio (OPV)',
      targetDoses: 52430,
      administeredDoses: 45820,
      coveragePercent: 87.4,
      defaulters: 6610,
      stockAvailability: 62000,
      trend: 'stable'
    },
    {
      vaccineName: 'Measles',
      targetDoses: 32500,
      administeredDoses: 28750,
      coveragePercent: 88.5,
      defaulters: 3750,
      stockAvailability: 28000,
      trend: 'up'
    },
    {
      vaccineName: 'DPT',
      targetDoses: 52430,
      administeredDoses: 41940,
      coveragePercent: 80.0,
      defaulters: 10490,
      stockAvailability: 45000,
      trend: 'down'
    }
  ];

  districtColumns: string[] = ['rank', 'districtName', 'facilities', 'coverage', 'vaccinated', 'trend', 'stockStatus', 'actions'];
  campaignColumns: string[] = ['campaignName', 'districts', 'progress', 'coverage', 'budget', 'status', 'actions'];
  stockColumns: string[] = ['districtName', 'totalStock', 'distributed', 'remaining', 'expiring', 'risk', 'actions'];
  vaccineColumns: string[] = ['vaccineName', 'progress', 'coverage', 'defaulters', 'stock', 'trend'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private reportingService: ReportingService,
    private campaignService: CampaignService,
    private inventoryService: InventoryRealService,
    private statisticsService: StatisticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Government officials should use 'NATIONAL' instead of a facility ID
    this.facilityId = this.authService.getFacilityId();
    console.log('Government Dashboard - User:', this.currentUser?.username, 'FacilityId:', this.facilityId);
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadNationalStats();
    this.loadCampaigns();
    this.loadStockData();
    // District performance will require additional backend endpoints
  }

  loadNationalStats(): void {
    console.log('Loading national statistics for government official...');
    
    // Use StatisticsService to get national-level data
    this.statisticsService.getNationalStatistics().subscribe({
      next: (data: NationalStatistics) => {
        console.log('National statistics loaded:', data);
        this.stats = {
          totalDistricts: 8, // TODO: Get from backend
          totalFacilities: data.totalFacilities,
          totalPatientsRegistered: data.totalPatientsRegistered,
          totalVaccinationsThisMonth: Math.floor(data.totalVaccinationsAdministered * 0.15), // Approximate this month
          nationalCoverageRate: data.coverageRate,
          activeCampaigns: data.activeCampaigns,
          completedCampaignsThisYear: 0, // TODO: Add to backend
          totalVaccineStock: data.totalDosesAvailable
        };
      },
      error: (error) => {
        console.warn('Could not load national statistics from API, using mock data:', error);
        // Fall back to mock data
        const mockData = this.statisticsService.getMockNationalStatistics();
        this.stats = {
          totalDistricts: 8,
          totalFacilities: mockData.totalFacilities,
          totalPatientsRegistered: mockData.totalPatientsRegistered,
          totalVaccinationsThisMonth: Math.floor(mockData.totalVaccinationsAdministered * 0.15),
          nationalCoverageRate: mockData.coverageRate,
          activeCampaigns: mockData.activeCampaigns,
          completedCampaignsThisYear: 0,
          totalVaccineStock: mockData.totalDosesAvailable
        };
        this.showError('Using mock data - backend endpoint not available yet');
      }
    });
  }

  loadCampaigns(): void {
    console.log('Loading campaigns for government official...');
    
    // For government officials, load ALL campaigns (not filtered by facility)
    // If the backend returns 403, we'll provide mock data
    this.campaignService.getActiveCampaigns().subscribe({
      next: (campaigns) => {
        console.log('Campaigns loaded:', campaigns.length);
        this.campaignOverviews = campaigns.map(c => ({
          id: String(c.id),
          campaignName: c.name,
          targetDistricts: [c.districtId || 'National'],
          totalTargetPopulation: c.targetPopulation || 0,
          totalVaccinated: c.vaccinatedCount,
          coveragePercent: c.coveragePercentage || 0,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status.toLowerCase() as 'active' | 'completed' | 'planned',
          budget: 0,
          spent: 0
        }));
      },
      error: (error) => {
        console.warn('Could not load campaigns (403 Forbidden expected if endpoint not updated):', error);
        // Provide mock campaigns for now
        this.campaignOverviews = [
          {
            id: '1',
            campaignName: 'National COVID-19 Booster Drive',
            targetDistricts: ['All Districts'],
            totalTargetPopulation: 50000,
            totalVaccinated: 32500,
            coveragePercent: 65,
            startDate: '2024-11-01',
            endDate: '2024-12-31',
            status: 'active',
            budget: 0,
            spent: 0
          }
        ];
        this.showError('Campaign endpoint requires backend update for government officials');
      }
    });
  }

  loadStockData(): void {
    console.log('Loading stock data for government official...');
    
    // Government officials viewing NATIONAL data - backend needs to support this
    // For now, skip or use aggregate data from national stats
    if (this.facilityId === 'NATIONAL') {
      console.log('Stock data already loaded from national statistics');
      // totalVaccineStock is already set in loadNationalStats
      this.isLoading = false; // Important: stop the loader
      return;
    }
    
    this.inventoryService.getAvailableBatches(this.facilityId).subscribe({
      next: (batches) => {
        // Calculate total vaccine stock
        this.stats.totalVaccineStock = batches.reduce((sum, batch) =>
          sum + batch.quantityRemaining, 0);

        // Group by vaccine for stock by district view
        const vaccineMap = new Map<string, any>();
        batches.forEach(batch => {
          const existing = vaccineMap.get(batch.vaccineName) || {
            totalStock: 0,
            distributed: 0,
            remaining: 0,
            expiringIn30Days: 0
          };
          existing.totalStock += batch.quantityReceived;
          existing.remaining += batch.quantityRemaining;
          existing.distributed += (batch.quantityReceived - batch.quantityRemaining);
          if (batch.isExpiringSoon) {
            existing.expiringIn30Days += batch.quantityRemaining;
          }
          vaccineMap.set(batch.vaccineName, existing);
        });

        this.vaccineStockByDistrict = [{
          districtName: this.facilityId === 'NATIONAL' ? 'National Overview' : this.facilityId,
          totalStock: this.stats.totalVaccineStock,
          distributed: batches.reduce((sum, b) =>
            sum + (b.quantityReceived - b.quantityRemaining), 0),
          remaining: this.stats.totalVaccineStock,
          expiringIn30Days: batches.filter(b => b.isExpiringSoon)
            .reduce((sum, b) => sum + b.quantityRemaining, 0),
          stockoutRisk: this.stats.totalVaccineStock < 5000 ? 'high' :
                       this.stats.totalVaccineStock < 10000 ? 'medium' : 'low',
          lastRestockDate: new Date().toISOString().split('T')[0]
        }];

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading stock data:', error);
        this.showError('Failed to load stock data');
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

  onTimeRangeChange(range: string): void {
    this.selectedTimeRange = range;
    this.loadDashboardData();
  }

  getTrendIcon(trend: string): string {
    const trendMap: { [key: string]: string } = {
      'up': 'trending_up',
      'down': 'trending_down',
      'stable': 'trending_flat'
    };
    return trendMap[trend] || 'trending_flat';
  }

  getTrendClass(trend: string): string {
    const trendMap: { [key: string]: string } = {
      'up': 'trend-up',
      'down': 'trend-down',
      'stable': 'trend-stable'
    };
    return trendMap[trend] || '';
  }

  getStockStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'optimal': 'status-optimal',
      'low': 'status-low',
      'critical': 'status-critical'
    };
    return statusMap[status] || '';
  }

  getRiskClass(risk: string): string {
    const riskMap: { [key: string]: string } = {
      'low': 'risk-low',
      'medium': 'risk-medium',
      'high': 'risk-high'
    };
    return riskMap[risk] || '';
  }

  getCampaignStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'status-active',
      'completed': 'status-completed',
      'planned': 'status-planned'
    };
    return statusMap[status] || '';
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 90) return 'primary';
    if (coverage >= 75) return 'accent';
    return 'warn';
  }

  getBudgetPercentage(campaign: CampaignOverview): number {
    return (campaign.spent / campaign.budget) * 100;
  }

  // Navigation methods
  navigateToDistrictDetails(district: DistrictPerformance): void {
    this.router.navigate(['/districts/details', district.districtName]);
  }

  navigateToCampaignDetails(campaign: CampaignOverview): void {
    this.router.navigate(['/campaigns/national', campaign.id]);
  }

  navigateToStockManagement(district: VaccineStockByDistrict): void {
    this.router.navigate(['/stock/district', district.districtName]);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports/national']);
  }

  // Export methods
  exportDistrictReport(): void {
    console.log('Exporting district performance report');
    // TODO: Implement export functionality
  }

  exportCampaignReport(): void {
    console.log('Exporting campaign report');
    // TODO: Implement export functionality
  }

  exportStockReport(): void {
    console.log('Exporting stock report');
    // TODO: Implement export functionality
  }

  exportCoverageReport(): void {
    console.log('Exporting coverage report');
    // TODO: Implement export functionality
  }
}
