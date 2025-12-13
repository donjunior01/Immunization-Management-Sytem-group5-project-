import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface CampaignMetric {
  id: number;
  name: string;
  vaccineName: string;
  targetPopulation: number;
  vaccinatedCount: number;
  coveragePercent: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  facilityName: string;
  scope: string;
}

interface AnalyticsKPI {
  totalCampaigns: number;
  activeCampaigns: number;
  averageCoverage: number;
  totalVaccinated: number;
  targetPopulation: number;
  completionRate: number;
}

interface VaccineDistribution {
  vaccine: string;
  count: number;
  percentage: number;
  color: string;
}

interface CoverageChart {
  month: string;
  coverage: number;
  target: number;
  vaccinated: number;
}

interface AgeGroupData {
  ageGroup: string;
  targetPopulation: number;
  vaccinated: number;
  coverage: number;
}

interface FacilityPerformance {
  facilityName: string;
  activeCampaigns: number;
  totalVaccinated: number;
  averageCoverage: number;
  rank: number;
}

@Component({
  selector: 'app-campaign-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './campaign-analytics.component.html',
  styleUrl: './campaign-analytics.component.scss'
})
export class CampaignAnalyticsComponent implements OnInit {
  kpis: AnalyticsKPI = {
    totalCampaigns: 0,
    activeCampaigns: 0,
    averageCoverage: 0,
    totalVaccinated: 0,
    targetPopulation: 0,
    completionRate: 0
  };

  campaigns: CampaignMetric[] = [];
  vaccineDistribution: VaccineDistribution[] = [];
  coverageTrends: CoverageChart[] = [];
  ageGroupData: AgeGroupData[] = [];
  facilityPerformance: FacilityPerformance[] = [];

  // Filter options
  selectedTimeRange: string = '3months';
  selectedScope: string = 'all';
  timeRangeOptions = [
    { value: '1month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' }
  ];
  scopeOptions = [
    { value: 'all', label: 'All Campaigns' },
    { value: 'facility', label: 'Facility Level' },
    { value: 'district', label: 'District Level' },
    { value: 'national', label: 'National Level' }
  ];

  // Table columns
  comparisonColumns: string[] = ['campaign', 'vaccine', 'target', 'vaccinated', 'coverage', 'status', 'daysLeft'];
  performanceColumns: string[] = ['rank', 'facility', 'campaigns', 'vaccinated', 'avgCoverage'];

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loadCampaigns();
      this.calculateKPIs();
      this.calculateVaccineDistribution();
      this.generateCoverageTrends();
      this.loadAgeGroupData();
      this.loadFacilityPerformance();
      this.loaderService.hide();
      this.notificationService.showSuccess('Analytics data loaded successfully');
    }, 1000);
  }

  loadCampaigns(): void {
    // Mock data from database schema
    this.campaigns = [
      {
        id: 1,
        name: 'BCG Newborn Campaign 2024',
        vaccineName: 'BCG',
        targetPopulation: 500,
        vaccinatedCount: 245,
        coveragePercent: 49.0,
        status: 'ACTIVE',
        startDate: '2024-11-01',
        endDate: '2025-01-31',
        daysRemaining: 51,
        facilityName: 'Central Health Facility',
        scope: 'FACILITY'
      },
      {
        id: 2,
        name: 'Measles Outbreak Response',
        vaccineName: 'Measles',
        targetPopulation: 1000,
        vaccinatedCount: 387,
        coveragePercent: 38.7,
        status: 'ACTIVE',
        startDate: '2024-12-01',
        endDate: '2025-02-28',
        daysRemaining: 79,
        facilityName: 'Central Health Facility',
        scope: 'FACILITY'
      },
      {
        id: 3,
        name: 'DTP Catch-up Campaign',
        vaccineName: 'DTP',
        targetPopulation: 750,
        vaccinatedCount: 523,
        coveragePercent: 69.7,
        status: 'ACTIVE',
        startDate: '2024-11-15',
        endDate: '2025-01-15',
        daysRemaining: 35,
        facilityName: 'Westlands Medical Center',
        scope: 'DISTRICT'
      },
      {
        id: 4,
        name: 'Polio National Immunization Day',
        vaccineName: 'OPV',
        targetPopulation: 5000,
        vaccinatedCount: 0,
        coveragePercent: 0,
        status: 'PLANNED',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        daysRemaining: 35,
        facilityName: 'National Program',
        scope: 'NATIONAL'
      },
      {
        id: 5,
        name: 'Hepatitis B Birth Dose',
        vaccineName: 'Hepatitis B',
        targetPopulation: 800,
        vaccinatedCount: 0,
        coveragePercent: 0,
        status: 'PLANNED',
        startDate: '2025-02-01',
        endDate: '2025-04-30',
        daysRemaining: 52,
        facilityName: 'Central Health Facility',
        scope: 'FACILITY'
      },
      {
        id: 6,
        name: 'Q3 Routine Immunization',
        vaccineName: 'Multiple',
        targetPopulation: 2000,
        vaccinatedCount: 1847,
        coveragePercent: 92.4,
        status: 'COMPLETED',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        daysRemaining: 0,
        facilityName: 'Central Health Facility',
        scope: 'FACILITY'
      }
    ];
  }

  calculateKPIs(): void {
    const totalCampaigns = this.campaigns.length;
    const activeCampaigns = this.campaigns.filter(c => c.status === 'ACTIVE').length;
    const completedCampaigns = this.campaigns.filter(c => c.status === 'COMPLETED').length;
    
    const totalVaccinated = this.campaigns.reduce((sum, c) => sum + c.vaccinatedCount, 0);
    const targetPopulation = this.campaigns.reduce((sum, c) => sum + c.targetPopulation, 0);
    
    const averageCoverage = totalCampaigns > 0
      ? this.campaigns.reduce((sum, c) => sum + c.coveragePercent, 0) / totalCampaigns
      : 0;
    
    const completionRate = totalCampaigns > 0
      ? (completedCampaigns / totalCampaigns) * 100
      : 0;

    this.kpis = {
      totalCampaigns,
      activeCampaigns,
      averageCoverage: Math.round(averageCoverage * 10) / 10,
      totalVaccinated,
      targetPopulation,
      completionRate: Math.round(completionRate * 10) / 10
    };
  }

  calculateVaccineDistribution(): void {
    const vaccineCount = new Map<string, number>();
    
    this.campaigns.forEach(campaign => {
      const vaccine = campaign.vaccineName;
      vaccineCount.set(vaccine, (vaccineCount.get(vaccine) || 0) + 1);
    });

    const total = this.campaigns.length;
    const colors = ['#f093fb', '#38ef7d', '#4facfe', '#ffa726', '#ab47bc', '#42a5f5'];
    let colorIndex = 0;

    this.vaccineDistribution = Array.from(vaccineCount.entries()).map(([vaccine, count]) => ({
      vaccine,
      count,
      percentage: Math.round((count / total) * 100 * 10) / 10,
      color: colors[colorIndex++ % colors.length]
    })).sort((a, b) => b.count - a.count);
  }

  generateCoverageTrends(): void {
    // Mock historical data for the last 6 months
    this.coverageTrends = [
      { month: 'Jul 2024', coverage: 85.2, target: 10000, vaccinated: 8520 },
      { month: 'Aug 2024', coverage: 78.5, target: 10000, vaccinated: 7850 },
      { month: 'Sep 2024', coverage: 92.4, target: 10000, vaccinated: 9240 },
      { month: 'Oct 2024', coverage: 67.3, target: 10000, vaccinated: 6730 },
      { month: 'Nov 2024', coverage: 71.8, target: 10000, vaccinated: 7180 },
      { month: 'Dec 2024', coverage: 55.4, target: 10000, vaccinated: 5540 }
    ];
  }

  loadAgeGroupData(): void {
    this.ageGroupData = [
      { ageGroup: '0-1 months', targetPopulation: 1800, vaccinated: 1290, coverage: 71.7 },
      { ageGroup: '2-6 months', targetPopulation: 2500, vaccinated: 1875, coverage: 75.0 },
      { ageGroup: '7-12 months', targetPopulation: 2200, vaccinated: 1540, coverage: 70.0 },
      { ageGroup: '13-24 months', targetPopulation: 1800, vaccinated: 1260, coverage: 70.0 },
      { ageGroup: '2-5 years', targetPopulation: 5000, vaccinated: 3500, coverage: 70.0 },
      { ageGroup: '5+ years', targetPopulation: 1500, vaccinated: 1050, coverage: 70.0 }
    ];
  }

  loadFacilityPerformance(): void {
    this.facilityPerformance = [
      {
        facilityName: 'Central Health Facility',
        activeCampaigns: 4,
        totalVaccinated: 2479,
        averageCoverage: 73.7,
        rank: 1
      },
      {
        facilityName: 'Westlands Medical Center',
        activeCampaigns: 1,
        totalVaccinated: 523,
        averageCoverage: 69.7,
        rank: 2
      },
      {
        facilityName: 'Eastlands Clinic',
        activeCampaigns: 2,
        totalVaccinated: 845,
        averageCoverage: 65.2,
        rank: 3
      },
      {
        facilityName: 'Northside Health Post',
        activeCampaigns: 1,
        totalVaccinated: 312,
        averageCoverage: 58.4,
        rank: 4
      }
    ];
  }

  onTimeRangeChange(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.generateCoverageTrends();
      this.loaderService.hide();
      this.notificationService.showSuccess(`Analytics updated for ${this.getTimeRangeLabel()}`);
    }, 800);
  }

  onScopeChange(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loadCampaigns();
      this.calculateKPIs();
      this.calculateVaccineDistribution();
      this.loaderService.hide();
      this.notificationService.showSuccess(`Showing ${this.getScopeLabel()} campaigns`);
    }, 800);
  }

  getTimeRangeLabel(): string {
    return this.timeRangeOptions.find(option => option.value === this.selectedTimeRange)?.label || '';
  }

  getScopeLabel(): string {
    return this.scopeOptions.find(option => option.value === this.selectedScope)?.label || '';
  }

  getCoverageClass(coverage: number): string {
    if (coverage >= 80) return 'coverage-excellent';
    if (coverage >= 60) return 'coverage-good';
    if (coverage >= 40) return 'coverage-fair';
    return 'coverage-poor';
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 80) return '#38ef7d';
    if (coverage >= 60) return '#f093fb';
    if (coverage >= 40) return '#ffa726';
    return '#ef5350';
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PLANNED': 'schedule',
      'ACTIVE': 'play_circle',
      'COMPLETED': 'check_circle',
      'CANCELLED': 'cancel'
    };
    return icons[status] || 'help';
  }

  getDaysRemainingClass(days: number): string {
    if (days <= 0) return 'days-expired';
    if (days <= 7) return 'days-critical';
    if (days <= 30) return 'days-warning';
    return 'days-normal';
  }

  exportAnalytics(): void {
    this.loaderService.show();
    setTimeout(() => {
      const csvContent = this.generateAnalyticsCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.loaderService.hide();
      this.notificationService.showSuccess('Analytics report exported successfully');
    }, 1000);
  }

  generateAnalyticsCSV(): string {
    let csv = 'Campaign Analytics Report\n\n';
    
    // KPIs Section
    csv += 'KEY PERFORMANCE INDICATORS\n';
    csv += 'Metric,Value\n';
    csv += `Total Campaigns,${this.kpis.totalCampaigns}\n`;
    csv += `Active Campaigns,${this.kpis.activeCampaigns}\n`;
    csv += `Average Coverage,${this.kpis.averageCoverage}%\n`;
    csv += `Total Vaccinated,${this.kpis.totalVaccinated}\n`;
    csv += `Target Population,${this.kpis.targetPopulation}\n`;
    csv += `Completion Rate,${this.kpis.completionRate}%\n\n`;

    // Campaign Details
    csv += 'CAMPAIGN DETAILS\n';
    csv += 'Campaign Name,Vaccine,Target Population,Vaccinated,Coverage %,Status,Days Remaining,Facility,Scope\n';
    this.campaigns.forEach(campaign => {
      csv += `"${campaign.name}",${campaign.vaccineName},${campaign.targetPopulation},${campaign.vaccinatedCount},${campaign.coveragePercent},${campaign.status},${campaign.daysRemaining},"${campaign.facilityName}",${campaign.scope}\n`;
    });
    csv += '\n';

    // Vaccine Distribution
    csv += 'VACCINE DISTRIBUTION\n';
    csv += 'Vaccine,Campaign Count,Percentage\n';
    this.vaccineDistribution.forEach(vd => {
      csv += `${vd.vaccine},${vd.count},${vd.percentage}%\n`;
    });
    csv += '\n';

    // Age Group Data
    csv += 'AGE GROUP ANALYSIS\n';
    csv += 'Age Group,Target Population,Vaccinated,Coverage %\n';
    this.ageGroupData.forEach(ag => {
      csv += `${ag.ageGroup},${ag.targetPopulation},${ag.vaccinated},${ag.coverage}%\n`;
    });
    csv += '\n';

    // Facility Performance
    csv += 'FACILITY PERFORMANCE\n';
    csv += 'Rank,Facility Name,Active Campaigns,Total Vaccinated,Average Coverage %\n';
    this.facilityPerformance.forEach(fp => {
      csv += `${fp.rank},"${fp.facilityName}",${fp.activeCampaigns},${fp.totalVaccinated},${fp.averageCoverage}%\n`;
    });

    return csv;
  }

  viewCampaignDetails(campaign: CampaignMetric): void {
    this.loaderService.show();
    setTimeout(() => {
      this.loaderService.hide();
      this.router.navigate(['/campaigns/manage']);
      this.notificationService.showInfo(`Viewing details for ${campaign.name}`);
    }, 800);
  }

  refreshAnalytics(): void {
    this.loadAnalyticsData();
  }
}
