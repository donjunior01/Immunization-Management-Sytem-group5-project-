import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { UserService } from '../../../core/services/user.service';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manager-staff',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, LayoutComponent, LoaderComponent],
  templateUrl: './manager-staff.component.html',
  styleUrl: './manager-staff.component.scss'
})
export class ManagerStaffComponent implements OnInit, OnDestroy {
  staff: User[] = [];
  loading = false;
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showSuccessModal = false;
  successMessage = '';
  successDetails: any = null;
  selectedStaff: User | null = null;
  staffForm: FormGroup;
  filterRole = 'all';
  filterStatus = 'all';
  private subscription?: Subscription;
  private loadingTimeout?: ReturnType<typeof setTimeout>;

  roles = [
    { value: 'HEALTH_WORKER', label: 'Health Worker' },
    { value: 'DATA_CLERK', label: 'Data Clerk' }
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.staffForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[26]\d{8}$/)]],
      role: ['HEALTH_WORKER', [Validators.required]],
      username: ['', [Validators.required]],
      password: ['', [Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    // Cancel any existing subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    
    // Clear any existing timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    this.loading = true;
    const startTime = Date.now();
    
    // Safety timeout to prevent infinite loading
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
        console.warn('Staff loading timeout - forcing stop');
        this.loading = false;
        if (this.subscription) {
          this.subscription.unsubscribe();
        }
      }
    }, 10000); // 10 second timeout

    // Load staff for current facility
this.subscription = this.userService.getFacilityStaff().subscribe({
      next: (staff) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = undefined;
        }
        this.staff = staff || [];
        // Set loading to false immediately, don't wait for minimum time
        this.loading = false;
        this.cdr.detectChanges();
},
      error: (error) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
          this.loadingTimeout = undefined;
        }
        console.warn('Failed to load staff:', error);
        this.staff = [];
        // Set loading to false immediately on error
        this.loading = false;
        this.cdr.detectChanges();
}
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  openAddModal(): void {
    this.staffForm.reset({
      role: 'HEALTH_WORKER'
    });
    // Make password required for add
    this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showAddModal = true;
  }

  openEditModal(staff: User): void {
    this.selectedStaff = staff;
    // Extract phone number without +237 prefix if present
    let phoneNumber = staff.phoneNumber || '';
    if (phoneNumber.startsWith('+237')) {
      phoneNumber = phoneNumber.substring(4);
    }
    this.staffForm.patchValue({
      fullName: staff.fullName,
      email: staff.email,
      phoneNumber: phoneNumber,
      role: staff.role,
      username: staff.username,
      password: '' // Don't pre-fill password
    });
    // Make password optional for edit
    this.staffForm.get('password')?.clearValidators();
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showEditModal = true;
  }

  openDeleteModal(staff: User): void {
    this.selectedStaff = staff;
    this.showDeleteModal = true;
  }

  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showSuccessModal = false;
    this.selectedStaff = null;
    this.staffForm.reset();
  }

  onSubmit(): void {
    if (this.staffForm.valid) {
      this.loading = true;
      const formValue = this.staffForm.value;
      
      // Prepare request data
      const requestData: any = {
        username: formValue.username,
        email: formValue.email,
        fullName: formValue.fullName,
        role: formValue.role
      };
      
      // Add phone number with +237 prefix
      if (formValue.phoneNumber) {
        requestData.phoneNumber = '+237' + formValue.phoneNumber;
      }

      if (this.showEditModal && this.selectedStaff) {
        // Update existing staff - password is optional for updates
        if (formValue.password && formValue.password.length >= 8) {
          requestData.password = formValue.password;
        }
        
        this.userService.updateUser(this.selectedStaff.id, requestData).subscribe({
          next: (updatedUser) => {
            this.loading = false;
            this.successMessage = 'Staff member updated successfully!';
            this.successDetails = {
              name: updatedUser.fullName || updatedUser.username,
              email: updatedUser.email,
              role: updatedUser.role,
              status: updatedUser.status || 'ACTIVE'
            };
            this.closeModals();
            this.showSuccessModal = true;
            this.loadStaff();
          },
          error: (error) => {
            this.loading = false;
            this.toastService.error(error?.error?.message || 'Failed to update staff member');
          }
        });
      } else {
        // Create new staff - password is required
        requestData.password = formValue.password;
        
        this.userService.createUser(requestData).subscribe({
          next: (createdUser) => {
            this.loading = false;
            this.successMessage = 'Staff member created successfully!';
            this.successDetails = {
              name: createdUser.fullName || createdUser.username,
              email: createdUser.email,
              role: createdUser.role,
              username: createdUser.username
            };
            this.closeModals();
            this.showSuccessModal = true;
            this.loadStaff();
          },
          error: (error) => {
            this.loading = false;
            this.toastService.error(error?.error?.message || 'Failed to create staff member');
          }
        });
      }
    } else {
      this.staffForm.markAllAsTouched();
    }
  }

  confirmDelete(): void {
    if (this.selectedStaff) {
      this.loading = true;
      this.userService.deactivateUser(this.selectedStaff.id).subscribe({
        next: () => {
          this.loading = false;
          this.closeModals();
          this.loadStaff();
        },
        error: (error) => {
          this.loading = false;
          this.toastService.error(error?.error?.message || 'Failed to deactivate staff member');
        }
      });
    }
  }

  getFilteredStaff(): User[] {
    return this.staff.filter(s => {
      if (this.filterRole !== 'all' && s.role !== this.filterRole) return false;
      if (this.filterStatus !== 'all' && s.status !== this.filterStatus) return false;
      return true;
    });
  }

  getRoleLabel(role: string | undefined): string {
    if (!role) return 'Unknown';
    const roleMap: { [key: string]: string } = {
      'HEALTH_WORKER': 'Health Worker',
      'DATA_CLERK': 'Data Clerk',
      'FACILITY_MANAGER': 'Facility Manager'
    };
    return roleMap[role] || role;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge-success';
      case 'INACTIVE': return 'badge-gray';
      case 'LOCKED': return 'badge-error';
      default: return 'badge-gray';
    }
  }
}
