import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { CampaignService, Campaign, CreateCampaignRequest } from '../../../core/services/campaign.service';
import { FacilityService } from '../../../core/services/facility.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-district-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './district-campaigns.component.html',
  styleUrl: './district-campaigns.component.scss'
})
export class DistrictCampaignsComponent implements OnInit {
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  facilities: any[] = [];
  loading = false;
  errorMessage = '';
  infoMessage = '';
  searchQuery = '';
  filterStatus = 'all';
  private isLoadingData = false;
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedCampaign: Campaign | null = null;
  campaignForm: FormGroup;
  editCampaignForm: FormGroup;

  constructor(
    private campaignService: CampaignService,
    private facilityService: FacilityService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      vaccineName: ['', [Validators.required, Validators.minLength(2)]],
      targetAgeGroup: [''],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      targetPopulation: [0, [Validators.min(0)]],
      facilityId: [''],
      districtId: [''],
      nationalId: [false]
    }, {
      validators: this.dateRangeValidator
    });

    this.editCampaignForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      vaccineName: ['', [Validators.required]],
      targetAgeGroup: [''],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      targetPopulation: [0, [Validators.min(0)]],
      facilityId: [''],
      districtId: [''],
      nationalId: [false]
    });
  }

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadFacilities();
  }

  loadFacilities(): void {
    const user = this.authService.getCurrentUser();
    let districtId = user?.districtId;
    const facilityId = user?.facilityId;

    if (!districtId && facilityId) {
      this.facilityService.getFacilityById(facilityId).subscribe({
        next: (facility) => {
          const facilityDistrictId = (facility as any).districtId || facility.district;
          if (facilityDistrictId) {
            districtId = facilityDistrictId;
            this.loadFacilitiesByDistrict(facilityDistrictId);
          }
        },
        error: () => {
          this.facilities = [];
        }
      });
    } else if (districtId) {
      this.loadFacilitiesByDistrict(districtId);
    } else {
      this.facilities = [];
    }
  }

  private loadFacilitiesByDistrict(districtId: string): void {
    this.facilityService.getFacilitiesByDistrict(districtId).subscribe({
      next: (facilities) => {
        this.facilities = facilities.map(f => ({ id: f.id, name: f.name || f.id }));
      },
      error: () => {
        this.facilities = [];
      }
    });
  }

  loadCampaigns(): void {
    if (this.isLoadingData) return;
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    const user = this.authService.getCurrentUser();
    let districtId = user?.districtId;
    const facilityId = user?.facilityId;

    if (!districtId && facilityId) {
      this.facilityService.getFacilityById(facilityId).subscribe({
        next: (facility) => {
          const facilityDistrictId = (facility as any).districtId || facility.district;
          if (facilityDistrictId) {
            districtId = facilityDistrictId;
            this.loadCampaignsForDistrict(facilityDistrictId, startTime);
          } else {
            this.loadCampaignsForDistrict(null, startTime);
          }
        },
        error: () => {
          this.loadCampaignsForDistrict(null, startTime);
        }
      });
    } else {
      this.loadCampaignsForDistrict(districtId || null, startTime);
    }
  }

  private loadCampaignsForDistrict(districtId: string | null, startTime: number): void {
    this.campaignService.getActiveCampaigns().subscribe({
      next: (campaigns) => {
        // Filter by district if available
        if (districtId) {
          this.campaigns = campaigns.filter(c => c.districtId === districtId || c.nationalId);
        } else {
          this.campaigns = campaigns;
        }
        this.applyFilter();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load campaigns:', error);
        this.errorMessage = 'Failed to load campaigns. Please try again.';
        this.campaigns = [];
        this.filteredCampaigns = [];
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.campaigns];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.vaccineName.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query))
      );
    }

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === this.filterStatus);
    }

    this.filteredCampaigns = filtered;
  }

  openCreateModal(): void {
    const user = this.authService.getCurrentUser();
    const districtId = user?.districtId;
    this.campaignForm.patchValue({
      districtId: districtId || '',
      nationalId: !districtId
    });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.campaignForm.reset();
  }

  onCreateSubmit(): void {
    if (this.campaignForm.invalid || this.loading) return;

    this.loading = true;
    const formValue = this.campaignForm.value;
    const campaign: CreateCampaignRequest = {
      name: formValue.name,
      description: formValue.description,
      vaccineName: formValue.vaccineName,
      targetAgeGroup: formValue.targetAgeGroup,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      targetPopulation: formValue.targetPopulation || 0,
      facilityId: formValue.facilityId || undefined,
      districtId: formValue.districtId || undefined,
      nationalId: formValue.nationalId || false
    };

    this.campaignService.createCampaign(campaign).subscribe({
      next: () => {
        this.loading = false;
        this.closeCreateModal();
        this.infoMessage = 'Campaign created successfully!';
        this.loadCampaigns();
        setTimeout(() => {
          this.infoMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to create campaign. Please try again.';
        console.error('Failed to create campaign:', error);
      }
    });
  }

  updateStatus(campaign: Campaign, status: Campaign['status']): void {
    this.campaignService.updateCampaignStatus(campaign.id, status).subscribe({
      next: () => {
        this.loadCampaigns();
      },
      error: (error) => {
        this.errorMessage = 'Failed to update campaign status. Please try again.';
        console.error('Failed to update campaign status:', error);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-planned';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getProgress(campaign: Campaign): number {
    if (!campaign.targetPopulation || campaign.targetPopulation === 0) return 0;
    return Math.min(100, Math.round((campaign.vaccinatedCount || 0) / campaign.targetPopulation * 100));
  }

  openEditModal(campaign: Campaign): void {
    this.selectedCampaign = campaign;
    this.editCampaignForm.patchValue({
      name: campaign.name,
      description: campaign.description || '',
      vaccineName: campaign.vaccineName,
      targetAgeGroup: campaign.targetAgeGroup || '',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      targetPopulation: campaign.targetPopulation || 0,
      facilityId: campaign.facilityId || '',
      districtId: campaign.districtId || '',
      nationalId: campaign.nationalId || false
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedCampaign = null;
    this.editCampaignForm.reset();
  }

  onEditSubmit(): void {
    if (this.editCampaignForm.invalid || !this.selectedCampaign) return;

    const formValue = this.editCampaignForm.value;
    // Note: Backend may not support full campaign updates, only status updates
    // For now, we'll show a message that full editing requires backend support
    this.infoMessage = 'Campaign details editing requires backend API support. Use status updates for now.';
    this.closeEditModal();
  }

  refreshData(): void {
    this.loadCampaigns();
    this.loadFacilities();
  }

  private dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        return { dateRangeInvalid: true };
      }
    }
    
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.campaignForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.campaignForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Campaign name',
      'vaccineName': 'Vaccine name',
      'startDate': 'Start date',
      'endDate': 'End date',
      'targetPopulation': 'Target population'
    };
    return labels[fieldName] || fieldName;
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  openViewModal(campaign: Campaign): void {
    this.selectedCampaign = campaign;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedCampaign = null;
  }
}
