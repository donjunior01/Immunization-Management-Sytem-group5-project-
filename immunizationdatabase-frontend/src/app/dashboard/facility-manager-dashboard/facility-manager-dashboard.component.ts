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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReportingService } from '../../services/reporting.service';
import { CampaignService } from '../../services/campaign.service';
import { InventoryRealService } from '../../services/inventory-real.service';
import { VaccinationRealService } from '../../services/vaccination-real.service';

interface FacilityStats {
  totalStaff: number;
  activeHealthWorkers: number;
  totalPatients: number;
  vaccinationsThisMonth: number;
  coverageRate: number;
  activeCampaigns: number;
  totalVaccineStock: number;
  lowStockItems: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  patientsRegistered: number;
  vaccinationsToday: number;
  status: 'active' | 'inactive' | 'on-leave';
  lastActive: string;
}

interface CampaignSummary {
  id: string;
  name: string;
  targetPopulation: number;
  vaccinated: number;
  coveragePercent: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  vaccinesAllocated: number;
  vaccinesUsed: number;
}

interface FacilityComparison {
  facilityName: string;
  district: string;
  coverageRate: number;
  totalVaccinations: number;
  stockStatus: 'optimal' | 'low' | 'critical';
  rank: number;
}

interface InventoryItem {
  vaccineName: string;
  totalStock: number;
  allocated: number;
  available: number;
  expiringIn30Days: number;
  reorderLevel: number;
  status: 'optimal' | 'low' | 'critical';
}

@Component({
  selector: 'app-facility-manager-dashboard',
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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './facility-manager-dashboard.component.html',
  styleUrls: ['./facility-manager-dashboard.component.scss']
})
export class FacilityManagerDashboardComponent implements OnInit {
  currentUser: any;
  isLoading = true;
  facilityId: string = '';

  stats: FacilityStats = {
    totalStaff: 0,
    activeHealthWorkers: 0,
    totalPatients: 0,
    vaccinationsThisMonth: 0,
    coverageRate: 0,
    activeCampaigns: 0,
    totalVaccineStock: 0,
    lowStockItems: 0
  };

  staffMembers: StaffMember[] = [
    {
      id: 'HW001',
      name: 'Sarah Johnson',
      role: 'Health Worker',
      patientsRegistered: 145,
      vaccinationsToday: 12,
      status: 'active',
      lastActive: '2025-12-04 10:30'
    },
    {
      id: 'HW002',
      name: 'John Kamau',
      role: 'Health Worker',
      patientsRegistered: 132,
      vaccinationsToday: 8,
      status: 'active',
      lastActive: '2025-12-04 09:45'
    },
    {
      id: 'HW003',
      name: 'Mary Wanjiku',
      role: 'Health Worker',
      patientsRegistered: 98,
      vaccinationsToday: 0,
      status: 'on-leave',
      lastActive: '2025-12-01 16:00'
    },
    {
      id: 'HW004',
      name: 'David Ochieng',
      role: 'Health Worker',
      patientsRegistered: 156,
      vaccinationsToday: 15,
      status: 'active',
      lastActive: '2025-12-04 11:00'
    }
  ];

  campaigns: CampaignSummary[] = [
    {
      id: 'CAMP001',
      name: 'Measles Vaccination Drive',
      targetPopulation: 500,
      vaccinated: 387,
      coveragePercent: 77.4,
      startDate: '2025-11-15',
      endDate: '2025-12-15',
      status: 'active',
      vaccinesAllocated: 550,
      vaccinesUsed: 387
    },
    {
      id: 'CAMP002',
      name: 'Polio Immunization Campaign',
      targetPopulation: 800,
      vaccinated: 712,
      coveragePercent: 89.0,
      startDate: '2025-11-01',
      endDate: '2025-12-10',
      status: 'active',
      vaccinesAllocated: 850,
      vaccinesUsed: 712
    }
  ];

  facilityComparisons: FacilityComparison[] = [
    {
      facilityName: 'City Health Center',
      district: 'Nairobi Central',
      coverageRate: 92.3,
      totalVaccinations: 1850,
      stockStatus: 'optimal',
      rank: 1
    },
    {
      facilityName: 'Westlands Clinic',
      district: 'Nairobi West',
      coverageRate: 87.5,
      totalVaccinations: 1247,
      stockStatus: 'low',
      rank: 2
    },
    {
      facilityName: 'Eastlands Medical Center',
      district: 'Nairobi East',
      coverageRate: 78.2,
      totalVaccinations: 950,
      stockStatus: 'critical',
      rank: 3
    }
  ];

  inventoryItems: InventoryItem[] = [
    {
      vaccineName: 'BCG Vaccine',
      totalStock: 850,
      allocated: 200,
      available: 650,
      expiringIn30Days: 45,
      reorderLevel: 500,
      status: 'optimal'
    },
    {
      vaccineName: 'Polio Vaccine (OPV)',
      totalStock: 320,
      allocated: 150,
      available: 170,
      expiringIn30Days: 12,
      reorderLevel: 400,
      status: 'low'
    },
    {
      vaccineName: 'Measles Vaccine',
      totalStock: 180,
      allocated: 120,
      available: 60,
      expiringIn30Days: 8,
      reorderLevel: 300,
      status: 'critical'
    },
    {
      vaccineName: 'DPT Vaccine',
      totalStock: 1200,
      allocated: 300,
      available: 900,
      expiringIn30Days: 0,
      reorderLevel: 600,
      status: 'optimal'
    }
  ];

  staffColumns: string[] = ['id', 'name', 'role', 'patientsRegistered', 'vaccinationsToday', 'status', 'actions'];
  campaignColumns: string[] = ['name', 'progress', 'coverage', 'dates', 'vaccines', 'actions'];
  facilityColumns: string[] = ['rank', 'facilityName', 'district', 'coverageRate', 'totalVaccinations', 'stockStatus'];
  inventoryColumns: string[] = ['vaccineName', 'stock', 'allocated', 'available', 'expiring', 'status', 'actions'];

  constructor(
    private router: Router,
    private authService: AuthService,
    private reportingService: ReportingService,
    private campaignService: CampaignService,
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
    this.loadCampaigns();
    this.loadInventory();
    // Staff management will be implemented when user management API is ready
  }

  loadStats(): void {
    this.reportingService.getDashboardStats(this.facilityId).subscribe({
      next: (data) => {
        this.stats = {
          totalStaff: 0, // TODO: Add staff count endpoint
          activeHealthWorkers: 0, // TODO: Add active staff endpoint
          totalPatients: Number(data.totalPatients || 0),
          vaccinationsThisMonth: Number(data.vaccinationsThisMonth || 0),
          coverageRate: Number(data.coverageRate || 0),
          activeCampaigns: Number(data.activeCampaigns || 0),
          totalVaccineStock: 0, // Will be calculated from inventory
          lowStockItems: Number(data.expiringBatches || 0)
        };
      },
      error: (error) => {
        console.error('Error loading facility stats:', error);
        this.showError('Failed to load facility statistics');
      }
    });
  }

  loadCampaigns(): void {
    this.campaignService.getActiveCampaigns(this.facilityId).subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns.map(c => ({
          id: String(c.id),
          name: c.name,
          targetPopulation: c.targetPopulation || 0,
          vaccinated: c.vaccinatedCount,
          coveragePercent: c.coveragePercentage || 0,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status.toLowerCase() as 'active' | 'completed' | 'upcoming',
          vaccinesAllocated: c.targetPopulation || 0,
          vaccinesUsed: c.vaccinatedCount
        }));
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.showError('Failed to load campaigns');
      }
    });
  }

  loadInventory(): void {
    this.inventoryService.getAvailableBatches(this.facilityId).subscribe({
      next: (batches) => {
        // Group batches by vaccine name
        const vaccineMap = new Map<string, any>();
        batches.forEach(batch => {
          const existing = vaccineMap.get(batch.vaccineName) || {
            totalStock: 0,
            allocated: 0,
            available: 0,
            expiringIn30Days: 0
          };
          existing.totalStock += batch.quantityReceived;
          existing.available += batch.quantityRemaining;
          if (batch.isExpiringSoon) {
            existing.expiringIn30Days += batch.quantityRemaining;
          }
          vaccineMap.set(batch.vaccineName, existing);
        });

        this.inventoryItems = Array.from(vaccineMap.entries()).map(([name, data]) => {
          const reorderLevel = 1000;
          const status: 'optimal' | 'low' | 'critical' =
            data.available < 300 ? 'critical' :
            data.available < reorderLevel * 0.5 ? 'low' : 'optimal';

          return {
            vaccineName: name,
            totalStock: data.totalStock,
            allocated: data.totalStock - data.available,
            available: data.available,
            expiringIn30Days: data.expiringIn30Days,
            reorderLevel: reorderLevel,
            status: status
          };
        });

        // Update total vaccine stock in stats
        this.stats.totalVaccineStock = this.inventoryItems.reduce((sum, item) => sum + item.available, 0);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading inventory:', error);
        this.showError('Failed to load inventory data');
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

  getStaffStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'status-active',
      'inactive': 'status-inactive',
      'on-leave': 'status-on-leave'
    };
    return statusMap[status] || '';
  }

  getCampaignStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'status-active',
      'completed': 'status-completed',
      'upcoming': 'status-upcoming'
    };
    return statusMap[status] || '';
  }

  getStockStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'optimal': 'status-optimal',
      'low': 'status-low',
      'critical': 'status-critical'
    };
    return statusMap[status] || '';
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 90) return 'primary';
    if (coverage >= 75) return 'accent';
    return 'warn';
  }

  getStockPercentage(item: InventoryItem): number {
    return (item.available / item.reorderLevel) * 100;
  }

  // Navigation methods
  navigateToStaffManagement(): void {
    this.router.navigate(['/staff/manage']);
  }

  navigateToCampaignManagement(): void {
    this.router.navigate(['/campaigns/manage']);
  }

  navigateToInventoryManagement(): void {
    this.router.navigate(['/inventory/manage']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  navigateToCreateCampaign(): void {
    this.router.navigate(['/campaigns/create']);
  }

  navigateToAllocateStaff(): void {
    this.router.navigate(['/staff/allocate']);
  }

  navigateToOrderStock(): void {
    this.router.navigate(['/inventory/order']);
  }

  // Action methods
  viewStaffDetails(staff: StaffMember): void {
    console.log('View staff details:', staff);
    this.router.navigate(['/staff/details', staff.id]);
  }

  assignStaffToCampaign(staff: StaffMember): void {
    console.log('Assign staff to campaign:', staff);
    // TODO: Open dialog to assign staff to campaign
  }

  viewCampaignDetails(campaign: CampaignSummary): void {
    console.log('View campaign details:', campaign);
    this.router.navigate(['/campaigns/details', campaign.id]);
  }

  allocateVaccinesToCampaign(campaign: CampaignSummary): void {
    console.log('Allocate vaccines to campaign:', campaign);
    // TODO: Open dialog to allocate vaccines
  }

  viewInventoryDetails(item: InventoryItem): void {
    console.log('View inventory details:', item);
    this.router.navigate(['/inventory/details', item.vaccineName]);
  }

  reorderStock(item: InventoryItem): void {
    console.log('Reorder stock:', item);
    // TODO: Open dialog to create reorder request
  }

  exportReport(reportType: string): void {
    console.log('Export report:', reportType);
    // TODO: Generate and download report
  }
}
