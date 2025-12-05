import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CampaignService } from '../../services/campaign.service';
import { Campaign, CampaignStatus } from '../../models/campaign.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-campaign-progress',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './campaign-progress.component.html',
  styleUrls: ['./campaign-progress.component.scss']
})
export class CampaignProgressComponent implements OnInit {
  campaign: Campaign | null = null;
  isLoading = false;
  campaignId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.campaignId = params['id'] ? +params['id'] : null;
      if (this.campaignId) {
        this.loadCampaignDetails();
      } else {
        this.showError('No campaign ID provided');
        this.goBack();
      }
    });
  }

  loadCampaignDetails(): void {
    if (!this.campaignId) return;

    this.isLoading = true;
    
    // Get facilityId using authService - handles all user types
    const facilityId = this.authService.getFacilityId();
    
    // Government officials see all campaigns, others see facility-specific
    const campaignObservable = facilityId === 'NATIONAL' 
      ? this.campaignService.getActiveCampaigns()
      : this.campaignService.getCampaignsByFacility(facilityId);
    
    campaignObservable.subscribe({
      next: (campaigns) => {
        this.campaign = campaigns.find(c => c.id === this.campaignId) || null;
        if (!this.campaign) {
          this.showError('Campaign not found');
          this.goBack();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.showError('Failed to load campaign details');
        this.isLoading = false;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  getCoverageStatus(coverage: number): string {
    if (coverage >= 90) return 'Excellent';
    if (coverage >= 70) return 'Good';
    if (coverage >= 50) return 'Fair';
    return 'Needs Improvement';
  }

  getDaysRemaining(): number {
    if (!this.campaign) return 0;
    const endDate = new Date(this.campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  getDurationDays(): number {
    if (!this.campaign) return 0;
    const startDate = new Date(this.campaign.startDate);
    const endDate = new Date(this.campaign.endDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  updateStatus(newStatus: CampaignStatus): void {
    if (!this.campaign) return;

    this.isLoading = true;
    this.campaignService.updateCampaignStatus(this.campaign.id, newStatus).subscribe({
      next: (updatedCampaign) => {
        this.campaign = updatedCampaign;
        this.showSuccess(`Campaign status updated to ${newStatus}`);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.showError('Failed to update campaign status');
        this.isLoading = false;
      }
    });
  }

  activateCampaign(): void {
    this.updateStatus(CampaignStatus.ACTIVE);
  }

  completeCampaign(): void {
    this.updateStatus(CampaignStatus.COMPLETED);
  }

  cancelCampaign(): void {
    this.updateStatus(CampaignStatus.CANCELLED);
  }

  exportReport(): void {
    if (!this.campaign) return;

    // Generate CSV report
    const csvData = this.generateCsvReport();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-report-${this.campaign.id}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.showSuccess('Report exported successfully');
  }

  private generateCsvReport(): string {
    if (!this.campaign) return '';

    const headers = [
      'Campaign ID',
      'Name',
      'Vaccine',
      'Age Group',
      'Start Date',
      'End Date',
      'Target Population',
      'Vaccinated Count',
      'Coverage %',
      'Status',
      'Created At'
    ];

    const data = [
      this.campaign.id,
      this.campaign.name,
      this.campaign.vaccineName,
      this.campaign.targetAgeGroup || 'All Ages',
      this.campaign.startDate,
      this.campaign.endDate,
      this.campaign.targetPopulation || 'N/A',
      this.campaign.vaccinatedCount,
      this.campaign.coveragePercentage,
      this.campaign.status,
      this.campaign.createdAt
    ];

    return `${headers.join(',')}\n${data.join(',')}`;
  }

  goBack(): void {
    this.router.navigate(['/campaigns/active']);
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
