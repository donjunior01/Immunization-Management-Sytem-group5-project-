import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole, CreateUserRequest } from '../../../core/models/user.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent, ConfirmationModalComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  loading = false;
  showCreateForm = false;
  showEditForm = false;
  selectedUser: User | null = null;
  showDeleteModal = false;
  userToDelete: User | null = null;
  errorMessage = '';
  successMessage = '';
  userForm: FormGroup;
  UserRole = UserRole;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: [''],
      role: [UserRole.HEALTH_WORKER, [Validators.required]],
      facilityId: [''],
      firstName: [''],
      lastName: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    const startTime = Date.now();

    if (environment.useMockAuth) {
      setTimeout(() => {
        this.loadMockUsers();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
        });
      }, 300);
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
        });
      },
      error: (error) => {
        console.warn('Failed to load users, using mock data:', error);
        this.loadMockUsers();
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
        });
      }
    });
  }

  private loadMockUsers(): void {
    this.users = [
      {
        id: '1',
        username: 'vaccinator',
        email: 'vaccinator@vaxtrack.com',
        role: 'HEALTH_WORKER',
        facilityId: 'FAC001',
        facilityName: 'Mvog-Ada Health Center',
        fullName: 'Dr. Sarah Mbah',
        firstName: 'Sarah',
        lastName: 'Mbah',
        isActive: true,
        active: true,
        status: 'ACTIVE'
      },
      {
        id: '2',
        username: 'manager',
        email: 'manager@vaxtrack.com',
        role: 'FACILITY_MANAGER',
        facilityId: 'FAC001',
        facilityName: 'Mvog-Ada Health Center',
        fullName: 'John Manager',
        firstName: 'John',
        lastName: 'Manager',
        isActive: true,
        active: true,
        status: 'ACTIVE'
      },
      {
        id: '3',
        username: 'admin',
        email: 'admin@vaxtrack.com',
        role: 'GOVERNMENT_OFFICIAL',
        facilityId: '',
        facilityName: 'System Administration',
        fullName: 'System Admin',
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        active: true,
        status: 'ACTIVE'
      },
      {
        id: '4',
        username: 'district',
        email: 'district@vaxtrack.com',
        role: 'GOVERNMENT_OFFICIAL',
        facilityId: '',
        facilityName: 'District Office',
        fullName: 'District Officer',
        firstName: 'District',
        lastName: 'Officer',
        isActive: true,
        active: true,
        status: 'ACTIVE'
      }
    ] as User[];
  }

  openCreateForm(): void {
    this.userForm.reset({
      role: UserRole.HEALTH_WORKER
    });
    this.showCreateForm = true;
    this.showEditForm = false;
  }

  openEditForm(user: User): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email || '',
      role: user.role,
      facilityId: user.facilityId || '',
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showEditForm = true;
    this.showCreateForm = false;
  }

  closeForms(): void {
    this.showCreateForm = false;
    this.showEditForm = false;
    this.selectedUser = null;
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      const startTime = Date.now();
      const userData = this.userForm.value;

      if (this.showEditForm && this.selectedUser) {
        const updateData: any = { ...userData };
        if (!updateData.password) {
          delete updateData.password;
        }
        this.userService.updateUser(this.selectedUser.id, updateData).subscribe({
          next: () => {
            this.successMessage = 'User updated successfully';
            this.closeForms();
            ensureMinimumLoadingTime(startTime, () => {
              this.loadUsers();
              this.loading = false;
            });
          },
          error: (error) => {
            this.errorMessage = 'Failed to update user';
            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
            });
          }
        });
      } else {
        this.userService.createUser(userData as CreateUserRequest).subscribe({
          next: () => {
            this.successMessage = 'User created successfully';
            this.closeForms();
            ensureMinimumLoadingTime(startTime, () => {
              this.loadUsers();
              this.loading = false;
            });
          },
          error: (error) => {
            this.errorMessage = 'Failed to create user';
            ensureMinimumLoadingTime(startTime, () => {
              this.loading = false;
            });
          }
        });
      }
    }
  }

  openDeleteModal(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.userToDelete) {
      this.loading = true;
      const startTime = Date.now();
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.successMessage = 'User deleted successfully';
          this.showDeleteModal = false;
          this.userToDelete = null;
          ensureMinimumLoadingTime(startTime, () => {
            this.loadUsers();
            this.loading = false;
          });
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete user';
          ensureMinimumLoadingTime(startTime, () => {
            this.loading = false;
          });
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }
}

