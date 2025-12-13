import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface Campaign {
  id: number;
  name: string;
  description: string;
  vaccineName: string;
  targetAgeGroup: string;
  startDate: string;
  endDate: string;
  targetPopulation: number;
  vaccinatedCount: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  facilityId: string | null;
  districtId: string | null;
  scope: 'FACILITY' | 'DISTRICT' | 'NATIONAL';
  coveragePercent: number;
}

interface CampaignStats {
  total: number;
  active: number;
  planned: number;
  completed: number;
}

@Component({
  selector: 'app-manage-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './manage-campaigns.component.html',
  styleUrls: ['./manage-campaigns.component.scss']
})
export class ManageCampaignsComponent implements OnInit {
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  displayedColumns: string[] = ['name', 'vaccine', 'dates', 'progress', 'coverage', 'status', 'actions'];
  
  stats: CampaignStats = {
    total: 0,
    active: 0,
    planned: 0,
    completed: 0
  };

  campaignForm!: FormGroup;
  isFormVisible = false;
  isEditMode = false;
  editingCampaignId: number | null = null;

  vaccines = [
    'BCG',
    'OPV',
    'DTP',
    'Measles',
    'Hepatitis B',
    'Polio',
    'Rotavirus',
    'Pneumococcal',
    'HPV',
    'Multiple'
  ];

  statusOptions = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
  scopeOptions = ['FACILITY', 'DISTRICT', 'NATIONAL'];

  searchTerm = '';
  statusFilter = 'ALL';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCampaigns();
  }

  initForm(): void {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      vaccineName: ['', Validators.required],
      targetAgeGroup: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      targetPopulation: ['', [Validators.required, Validators.min(1)]],
      scope: ['FACILITY', Validators.required],
      status: ['PLANNED', Validators.required]
    });
  }

  loadCampaigns(): void {
    this.loaderService.show();

    setTimeout(() => {
      // Mock data based on database schema
      this.campaigns = [
        {
          id: 1,
          name: 'BCG Newborn Campaign 2024',
          description: 'BCG vaccination for all newborns in the facility',
          vaccineName: 'BCG',
          targetAgeGroup: '0-1 months',
          startDate: '2024-11-01',
          endDate: '2025-01-31',
          targetPopulation: 500,
          vaccinatedCount: 245,
          status: 'ACTIVE',
          facilityId: 'FAC001',
          districtId: 'DIST001',
          scope: 'FACILITY',
          coveragePercent: 49.0
        },
        {
          id: 2,
          name: 'Measles Outbreak Response',
          description: 'Emergency measles vaccination campaign',
          vaccineName: 'Measles',
          targetAgeGroup: '9-59 months',
          startDate: '2024-12-01',
          endDate: '2025-02-28',
          targetPopulation: 1000,
          vaccinatedCount: 387,
          status: 'ACTIVE',
          facilityId: 'FAC001',
          districtId: 'DIST001',
          scope: 'FACILITY',
          coveragePercent: 38.7
        },
        {
          id: 3,
          name: 'DTP Catch-up Campaign',
          description: 'DTP vaccination for missed doses',
          vaccineName: 'DTP',
          targetAgeGroup: '6-18 months',
          startDate: '2024-11-15',
          endDate: '2025-01-15',
          targetPopulation: 750,
          vaccinatedCount: 523,
          status: 'ACTIVE',
          facilityId: 'FAC001',
          districtId: 'DIST001',
          scope: 'DISTRICT',
          coveragePercent: 69.7
        },
        {
          id: 4,
          name: 'Polio National Immunization Day',
          description: 'National polio eradication campaign',
          vaccineName: 'OPV',
          targetAgeGroup: '0-5 years',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          targetPopulation: 5000,
          vaccinatedCount: 0,
          status: 'PLANNED',
          facilityId: null,
          districtId: null,
          scope: 'NATIONAL',
          coveragePercent: 0
        },
        {
          id: 5,
          name: 'Hepatitis B Birth Dose',
          description: 'Hepatitis B vaccination at birth',
          vaccineName: 'Hepatitis B',
          targetAgeGroup: '0-1 months',
          startDate: '2025-02-01',
          endDate: '2025-04-30',
          targetPopulation: 800,
          vaccinatedCount: 0,
          status: 'PLANNED',
          facilityId: 'FAC001',
          districtId: 'DIST001',
          scope: 'FACILITY',
          coveragePercent: 0
        },
        {
          id: 6,
          name: 'Q3 Routine Immunization',
          description: 'Quarterly routine immunization drive',
          vaccineName: 'Multiple',
          targetAgeGroup: 'All ages',
          startDate: '2024-07-01',
          endDate: '2024-09-30',
          targetPopulation: 2000,
          vaccinatedCount: 1847,
          status: 'COMPLETED',
          facilityId: 'FAC001',
          districtId: 'DIST001',
          scope: 'FACILITY',
          coveragePercent: 92.4
        }
      ];

      this.calculateStats();
      this.applyFilters();
      this.loaderService.hide();
    }, 1000);
  }

  calculateStats(): void {
    this.stats.total = this.campaigns.length;
    this.stats.active = this.campaigns.filter(c => c.status === 'ACTIVE').length;
    this.stats.planned = this.campaigns.filter(c => c.status === 'PLANNED').length;
    this.stats.completed = this.campaigns.filter(c => c.status === 'COMPLETED').length;
  }

  applyFilters(): void {
    let filtered = this.campaigns;

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.vaccineName.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    this.filteredCampaigns = filtered;
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  showCreateForm(): void {
    this.isEditMode = false;
    this.editingCampaignId = null;
    this.campaignForm.reset({
      scope: 'FACILITY',
      status: 'PLANNED'
    });
    this.isFormVisible = true;
  }

  hideForm(): void {
    this.isFormVisible = false;
    this.campaignForm.reset();
  }

  editCampaign(campaign: Campaign): void {
    this.loaderService.show();

    setTimeout(() => {
      this.isEditMode = true;
      this.editingCampaignId = campaign.id;
      
      this.campaignForm.patchValue({
        name: campaign.name,
        description: campaign.description,
        vaccineName: campaign.vaccineName,
        targetAgeGroup: campaign.targetAgeGroup,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        targetPopulation: campaign.targetPopulation,
        scope: campaign.scope,
        status: campaign.status
      });

      this.isFormVisible = true;
      this.loaderService.hide();
    }, 800);
  }

  saveCampaign(): void {
    if (this.campaignForm.invalid) {
      this.notificationService.showError('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();

    setTimeout(() => {
      const formValue = this.campaignForm.value;

      if (this.isEditMode && this.editingCampaignId) {
        // Update existing campaign
        const index = this.campaigns.findIndex(c => c.id === this.editingCampaignId);
        if (index !== -1) {
          this.campaigns[index] = {
            ...this.campaigns[index],
            ...formValue,
            startDate: this.formatDate(formValue.startDate),
            endDate: this.formatDate(formValue.endDate)
          };
          this.notificationService.showSuccess('Campaign updated successfully');
        }
      } else {
        // Create new campaign
        const newCampaign: Campaign = {
          id: this.campaigns.length + 1,
          ...formValue,
          startDate: this.formatDate(formValue.startDate),
          endDate: this.formatDate(formValue.endDate),
          vaccinatedCount: 0,
          facilityId: formValue.scope === 'FACILITY' ? 'FAC001' : null,
          districtId: formValue.scope === 'DISTRICT' ? 'DIST001' : null,
          coveragePercent: 0
        };
        this.campaigns.unshift(newCampaign);
        this.notificationService.showSuccess('Campaign created successfully');
      }

      this.calculateStats();
      this.applyFilters();
      this.hideForm();
      this.loaderService.hide();
    }, 1000);
  }

  deleteCampaign(campaign: Campaign): void {
    if (!confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) {
      return;
    }

    this.loaderService.show();

    setTimeout(() => {
      this.campaigns = this.campaigns.filter(c => c.id !== campaign.id);
      this.calculateStats();
      this.applyFilters();
      this.notificationService.showSuccess('Campaign deleted successfully');
      this.loaderService.hide();
    }, 800);
  }

  changeStatus(campaign: Campaign, newStatus: string): void {
    this.loaderService.show();

    setTimeout(() => {
      const index = this.campaigns.findIndex(c => c.id === campaign.id);
      if (index !== -1) {
        this.campaigns[index].status = newStatus as any;
        this.calculateStats();
        this.applyFilters();
        this.notificationService.showSuccess(`Campaign status changed to ${newStatus}`);
      }
      this.loaderService.hide();
    }, 800);
  }

  viewCampaignDetails(campaign: Campaign): void {
    this.loaderService.show();
    setTimeout(() => {
      this.router.navigate(['/campaigns/details', campaign.id]);
      this.loaderService.hide();
    }, 800);
  }

  exportCampaigns(): void {
    this.loaderService.show();

    setTimeout(() => {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.notificationService.showSuccess('Campaigns exported successfully');
      this.loaderService.hide();
    }, 1000);
  }

  generateCSV(): string {
    const headers = ['ID', 'Name', 'Vaccine', 'Target Age Group', 'Start Date', 'End Date', 'Target Population', 'Vaccinated', 'Coverage %', 'Status', 'Scope'];
    const rows = this.filteredCampaigns.map(c => [
      c.id,
      c.name,
      c.vaccineName,
      c.targetAgeGroup,
      c.startDate,
      c.endDate,
      c.targetPopulation,
      c.vaccinatedCount,
      c.coveragePercent.toFixed(1),
      c.status,
      c.scope
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      PLANNED: 'schedule',
      ACTIVE: 'play_circle',
      COMPLETED: 'check_circle',
      CANCELLED: 'cancel'
    };
    return icons[status] || 'help';
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 80) return '#38ef7d';
    if (coverage >= 60) return '#f093fb';
    if (coverage >= 40) return '#ffa726';
    return '#ef5350';
  }

  getScopeIcon(scope: string): string {
    const icons: any = {
      FACILITY: 'business',
      DISTRICT: 'location_city',
      NATIONAL: 'public'
    };
    return icons[scope] || 'place';
  }
}
