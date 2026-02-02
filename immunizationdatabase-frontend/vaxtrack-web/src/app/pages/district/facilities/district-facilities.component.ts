import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { FacilityService, Facility } from '../../../core/services/facility.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';

@Component({
  selector: 'app-district-facilities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent],
  templateUrl: './district-facilities.component.html',
  styleUrl: './district-facilities.component.scss'
})
export class DistrictFacilitiesComponent implements OnInit {
  facilities: Facility[] = [];
  filteredFacilities: Facility[] = [];
  loading = false;
  errorMessage = '';
  infoMessage = '';
  searchQuery = '';
  filterType = 'all';
  filterActive = 'all';
  private isLoadingData = false;

  // Modal states
  showEditModal = false;
  showAssignDistrictModal = false;
  showViewModal = false;
  selectedFacility: Facility | null = null;
  facilityForm: FormGroup;
  assignDistrictForm: FormGroup;
  availableDistricts: Array<{id: string, name: string}> = []; // Districts extracted from facilities

  constructor(
    private facilityService: FacilityService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.facilityForm = this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      location: [''],
      county: [''],
      district: [''],
      active: [true]
    });

    this.assignDistrictForm = this.fb.group({
      districtId: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    if (this.isLoadingData) return;

    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    // District dashboard plays admin role - load ALL facilitiesthis.facilityService.getAllFacilities(true).subscribe({
      next: (facilities) => {ensureMinimumLoadingTime(startTime, () => {
          this.facilities = facilities;
          this.filteredFacilities = [...this.facilities];
          // Extract unique districts from facilities
          this.extractDistrictsFromFacilities(facilities);
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {console.error('Failed to load all facilities:', error);
        this.errorMessage = 'Failed to load facilities. Please try again.';
        this.loading = false;
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadFacilitiesByDistrict(districtId: string, startTime: number): void {
    this.facilityService.getFacilitiesByDistrict(districtId).subscribe({
      next: (facilities) => {
        this.facilities = facilities;
        this.applyFilter();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Failed to load facilities:', error);
        this.errorMessage = 'Failed to load facilities. Please try again.';
        this.facilities = [];
        this.filteredFacilities = [];
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
    let filtered = [...this.facilities];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.id.toLowerCase().includes(query) ||
        (f.location && f.location.toLowerCase().includes(query))
      );
    }

    if (this.filterType !== 'all') {
      filtered = filtered.filter(f => f.type === this.filterType);
    }

    if (this.filterActive !== 'all') {
      const isActive = this.filterActive === 'active';
      filtered = filtered.filter(f => (f.active !== false) === isActive);
    }

    this.filteredFacilities = filtered;
  }

  getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'HOSPITAL': return 'type-hospital';
      case 'HEALTH_CENTER': return 'type-health-center';
      case 'CLINIC': return 'type-clinic';
      default: return 'type-other';
    }
  }

  getActiveBadgeClass(active: boolean | undefined): string {
    return active !== false ? 'active-badge' : 'inactive-badge';
  }

  openEditModal(facility: Facility): void {
    this.selectedFacility = facility;
    this.facilityForm.patchValue({
      name: facility.name,
      type: facility.type || '',
      location: facility.location || '',
      county: facility.county || '',
      district: (facility as any).districtId || facility.district || '',
      active: facility.active !== false
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedFacility = null;
    this.facilityForm.reset();
  }

  onEditSubmit(): void {
    if (this.facilityForm.invalid || !this.selectedFacility || this.loading) return;

    this.loading = true;
    const formValue = this.facilityForm.value;
    const updateData: Partial<Facility> = {
      name: formValue.name,
      type: formValue.type,
      location: formValue.location,
      county: formValue.county,
      district: formValue.district,
      active: formValue.active
    };

    // Include districtId if provided
    if (formValue.district) {
      (updateData as any).districtId = formValue.district;
    }

    this.facilityService.updateFacility(this.selectedFacility.id, updateData).subscribe({
      next: () => {
        this.loading = false;
        this.closeEditModal();
        this.infoMessage = 'Facility updated successfully.';
        this.loadFacilities();
        setTimeout(() => {
          this.infoMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to update facility. Please try again.';
        console.error('Failed to update facility:', error);
      }
    });
  }

  private extractDistrictsFromFacilities(facilities: Facility[]): void {
    const districtMap = new Map<string, string>();

    facilities.forEach(facility => {
      const districtId = (facility as any).districtId || facility.district;
      if (districtId && !districtMap.has(districtId)) {
        // Use district ID as name if no name is available
        districtMap.set(districtId, districtId);
      }
    });

    // Convert map to array and sort
    this.availableDistricts = Array.from(districtMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  openAssignDistrictModal(facility: Facility): void {
    this.selectedFacility = facility;
    const currentDistrictId = (facility as any).districtId || facility.district || '';
    this.assignDistrictForm.patchValue({
      districtId: currentDistrictId
    });
    // Ensure districts are extracted
    if (this.availableDistricts.length === 0 && this.facilities.length > 0) {
      this.extractDistrictsFromFacilities(this.facilities);
    }
    this.showAssignDistrictModal = true;
  }

  closeAssignDistrictModal(): void {
    this.showAssignDistrictModal = false;
    this.selectedFacility = null;
    this.assignDistrictForm.reset();
  }

  onAssignDistrictSubmit(): void {
    if (this.assignDistrictForm.invalid || !this.selectedFacility || this.loading) return;

    this.loading = true;
    const districtId = this.assignDistrictForm.value.districtId;
    const updateData: Partial<Facility> = {
      ...this.selectedFacility,
      district: districtId
    };
    (updateData as any).districtId = districtId;

    this.facilityService.updateFacility(this.selectedFacility.id, updateData).subscribe({
      next: () => {
        this.loading = false;
        this.closeAssignDistrictModal();
        this.infoMessage = 'District assigned to facility successfully. Users in this facility will now have access to district data.';
        this.loadFacilities();
        setTimeout(() => {
          this.infoMessage = '';
        }, 7000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to assign district. Please try again.';
        console.error('Failed to assign district:', error);
      }
    });
  }

  refreshData(): void {
    this.loadFacilities();
  }

  openViewModal(facility: Facility): void {
    this.selectedFacility = facility;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedFacility = null;
  }

  isFieldInvalid(fieldName: string, form: FormGroup = this.facilityForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string, form: FormGroup = this.facilityForm): string {
    const field = form.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
    }
    return '';
  }

  getFacilityDistrictId(facility: Facility | null): string {
    if (!facility) return 'Not Assigned';
    return (facility as any).districtId || facility.district || 'Not Assigned';
  }

  getFacilityAddress(facility: Facility | null): string {
    if (!facility) return 'N/A';
    return (facility as any).address || facility.location || 'N/A';
  }

  hasDistrictAssigned(facility: Facility | null): boolean {
    if (!facility) return false;
    return !!(facility as any).districtId || !!facility.district;
  }
}
