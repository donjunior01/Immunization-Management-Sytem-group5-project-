import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  facilityId: string;
  active: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['fullName', 'username', 'email', 'role', 'status', 'createdAt', 'actions'];
  dataSource: MatTableDataSource<User>;
  userForm: FormGroup;
  showForm = false;
  editingUser: User | null = null;
  currentFacility: string = '';

  roles = [
    { value: 'HEALTH_WORKER', label: 'Health Worker' },
    { value: 'FACILITY_MANAGER', label: 'Facility Manager' }
  ];

  stats = {
    total: 0,
    active: 0,
    inactive: 0,
    healthWorkers: 0
  };

  constructor(
    private fb: FormBuilder,
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<User>([]);
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['HEALTH_WORKER', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loaderService.show();
    const currentUser = this.authService.getCurrentUser();
    this.currentFacility = currentUser?.facilityId || 'FAC001';
    this.loadUsers();
  }

  loadUsers(): void {
    setTimeout(() => {
      // Mock data - in production, this would be an API call
      const users: User[] = [
        {
          id: 1,
          username: 'health.worker',
          fullName: 'Health Worker',
          email: 'health.worker@immunization.com',
          role: 'HEALTH_WORKER',
          facilityId: 'FAC001',
          active: true,
          createdAt: '2024-01-15'
        },
        {
          id: 4,
          username: 'worker.fac002',
          fullName: 'Health Worker FAC002',
          email: 'worker.fac002@immunization.com',
          role: 'HEALTH_WORKER',
          facilityId: 'FAC002',
          active: true,
          createdAt: '2024-03-10'
        },
        {
          id: 5,
          username: 'nurse.jane',
          fullName: 'Jane Nurse',
          email: 'jane.nurse@immunization.com',
          role: 'HEALTH_WORKER',
          facilityId: 'FAC001',
          active: true,
          createdAt: '2024-05-20'
        },
        {
          id: 6,
          username: 'worker.john',
          fullName: 'John Worker',
          email: 'john.worker@immunization.com',
          role: 'HEALTH_WORKER',
          facilityId: 'FAC001',
          active: false,
          createdAt: '2024-02-28'
        }
      ];

      this.dataSource.data = users.filter(u => u.facilityId === this.currentFacility);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.calculateStats();
    }, 1000);
  }

  calculateStats(): void {
    const users = this.dataSource.data;
    this.stats.total = users.length;
    this.stats.active = users.filter(u => u.active).length;
    this.stats.inactive = users.filter(u => !u.active).length;
    this.stats.healthWorkers = users.filter(u => u.role === 'HEALTH_WORKER').length;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openAddUserForm(): void {
    this.showForm = true;
    this.editingUser = null;
    this.userForm.reset({
      role: 'HEALTH_WORKER',
      active: true
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
  }

  editUser(user: User): void {
    this.showForm = true;
    this.editingUser = user;
    this.userForm.patchValue({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      active: user.active
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.notificationService.error('Please fill all required fields correctly');
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      if (this.editingUser) {
        this.notificationService.success('User updated successfully');
      } else {
        this.notificationService.success('User created successfully');
      }
      this.cancelForm();
      this.loadUsers();
    }, 1000);
  }

  toggleUserStatus(user: User): void {
    if (!confirm(`Are you sure you want to ${user.active ? 'deactivate' : 'activate'} ${user.fullName}?`)) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      user.active = !user.active;
      this.notificationService.success(`User ${user.active ? 'activated' : 'deactivated'} successfully`);
      this.calculateStats();
    }, 1000);
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      const index = this.dataSource.data.indexOf(user);
      if (index > -1) {
        this.dataSource.data.splice(index, 1);
        this.dataSource.data = [...this.dataSource.data];
        this.calculateStats();
      }
      this.notificationService.success('User deleted successfully');
    }, 1000);
  }

  resetPassword(user: User): void {
    if (!confirm(`Send password reset email to ${user.email}?`)) {
      return;
    }

    this.loaderService.show();
    setTimeout(() => {
      this.notificationService.success('Password reset email sent successfully');
    }, 1000);
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingUser = null;
    this.userForm.reset();
  }

  exportUsers(): void {
    this.loaderService.show();
    setTimeout(() => {
      const csv = this.convertToCSV(this.dataSource.data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      this.notificationService.success('Users exported successfully');
    }, 1000);
  }

  private convertToCSV(data: User[]): string {
    const headers = ['ID', 'Username', 'Full Name', 'Email', 'Role', 'Status', 'Created At'];
    const rows = data.map(u => [
      u.id,
      u.username,
      u.fullName,
      u.email,
      u.role,
      u.active ? 'Active' : 'Inactive',
      u.createdAt
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getRoleIcon(role: string): string {
    if (role === 'HEALTH_WORKER') return 'local_hospital';
    if (role === 'FACILITY_MANAGER') return 'business';
    return 'person';
  }

  getRoleColor(role: string): string {
    if (role === 'HEALTH_WORKER') return 'primary';
    if (role === 'FACILITY_MANAGER') return 'accent';
    return 'warn';
  }
}
