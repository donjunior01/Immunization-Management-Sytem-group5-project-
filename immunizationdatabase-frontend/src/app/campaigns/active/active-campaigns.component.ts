import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { CampaignService } from '../../services/campaign.service';
import { AuthService } from '../../services/auth.service';
import { Campaign, CampaignStatus } from '../../models/campaign.model';

@Component({
  selector: 'app-active-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './active-campaigns.component.html',
  styleUrls: ['./active-campaigns.component.scss']
})
export class ActiveCampaignsComponent implements OnInit {
  displayedColumns: string[] = [
    'name',
    'vaccineName',
    'targetAgeGroup',
    'dates',
    'progress',
    'status',
    'actions'
  ];

  dataSource: MatTableDataSource<Campaign>;
  isLoading = false;
  campaigns: Campaign[] = [];
  currentUser: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private campaignService: CampaignService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Campaign>();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadCampaigns();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadCampaigns(): void {
    this.isLoading = true;
    
    // Use authService.getFacilityId() which handles all user types correctly
    const facilityId = this.authService.getFacilityId();

    // Government officials with NATIONAL facility ID should see all campaigns
    if (facilityId === 'NATIONAL') {
      this.campaignService.getActiveCampaigns().subscribe({
        next: (campaigns) => {
          this.campaigns = campaigns;
          this.dataSource.data = campaigns;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading campaigns:', error);
          this.showError('Failed to load campaigns');
          this.isLoading = false;
        }
      });
      return;
    }

    this.campaignService.getCampaignsByFacility(facilityId).subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.dataSource.data = campaigns;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaigns:', error);
        this.showError('Failed to load campaigns');
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusColor(status: CampaignStatus): string {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'primary';
      case CampaignStatus.PLANNED:
        return 'accent';
      case CampaignStatus.COMPLETED:
        return '';
      case CampaignStatus.CANCELLED:
        return 'warn';
      default:
        return '';
    }
  }

  getStatusIcon(status: CampaignStatus): string {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'play_circle';
      case CampaignStatus.PLANNED:
        return 'schedule';
      case CampaignStatus.COMPLETED:
        return 'check_circle';
      case CampaignStatus.CANCELLED:
        return 'cancel';
      default:
        return 'info';
    }
  }

  getProgressColor(coverage: number): string {
    if (coverage >= 90) return 'success';
    if (coverage >= 70) return 'primary';
    if (coverage >= 50) return 'accent';
    return 'warn';
  }

  viewCampaignDetails(campaign: Campaign): void {
    this.router.navigate(['/campaigns/progress'], {
      queryParams: { id: campaign.id }
    });
  }

  createNewCampaign(): void {
    this.router.navigate(['/campaigns/create']);
  }

  updateCampaignStatus(campaign: Campaign, newStatus: CampaignStatus): void {
    this.isLoading = true;
    this.campaignService.updateCampaignStatus(campaign.id, newStatus).subscribe({
      next: (updatedCampaign) => {
        this.showSuccess(`Campaign status updated to ${newStatus}`);
        this.loadCampaigns(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error updating campaign status:', error);
        this.showError('Failed to update campaign status');
        this.isLoading = false;
      }
    });
  }

  activateCampaign(campaign: Campaign): void {
    this.updateCampaignStatus(campaign, CampaignStatus.ACTIVE);
  }

  completeCampaign(campaign: Campaign): void {
    this.updateCampaignStatus(campaign, CampaignStatus.COMPLETED);
  }

  cancelCampaign(campaign: Campaign): void {
    this.updateCampaignStatus(campaign, CampaignStatus.CANCELLED);
  }

  getActiveCampaignsCount(): number {
    return this.campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length;
  }

  getPlannedCampaignsCount(): number {
    return this.campaigns.filter(c => c.status === CampaignStatus.PLANNED).length;
  }

  getTotalVaccinated(): number {
    return this.campaigns.reduce((sum, c) => sum + c.vaccinatedCount, 0);
  }

  getAverageCoverage(): number {
    if (this.campaigns.length === 0) return 0;
    const total = this.campaigns.reduce((sum, c) => sum + c.coveragePercentage, 0);
    return Math.round(total / this.campaigns.length);
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
