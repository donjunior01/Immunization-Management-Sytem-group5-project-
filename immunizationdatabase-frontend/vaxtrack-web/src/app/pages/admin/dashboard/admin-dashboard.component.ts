import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { UserService } from '../../../core/services/user.service';
import { SmsService } from '../../../core/services/sms.service';
import { FacilityService } from '../../../core/services/facility.service';
import { User } from '../../../core/models/user.model';
import { SmsLog } from '../../../core/models/sms.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ensureMinimumLoadingTime } from '../../../core/utils/loading.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent, AlertComponent, LoaderComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  totalUsers = 0;
  activeUsers = 0;
  activeFacilities = 3; // TODO: Get from facilities service
  totalVaccinations = 12450; // TODO: Get from vaccinations service
  systemHealth = 98;
  recentSmsLogs: SmsLog[] = [];
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  facilities: any[] = []; // TODO: Create facility model
  searchQuery = '';
  loading = false;
  errorMessage = '';

  private isLoadingData = false; // Prevent multiple simultaneous loads

  constructor(
    private userService: UserService,
    private smsService: SmsService,
    private facilityService: FacilityService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Prevent multiple simultaneous loads
    if (this.isLoadingData) {
      return;
    }
    
    this.isLoadingData = true;
    this.loading = true;
    const startTime = Date.now();
    
    
    let usersLoaded = false;
    let facilitiesLoaded = false;
    let smsLoaded = false;
    let isComplete = false;
    
    const checkComplete = () => {
      if (usersLoaded && facilitiesLoaded && smsLoaded && !isComplete) {
        isComplete = true;
        clearTimeout(timeoutId);
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
          setTimeout(() => {
            if (this.loading) {
              this.loading = false;
              this.cdr.detectChanges();
            }
          }, 50);
        });
      }
    };
    
    // Safety timeout - ensure loader stops after 3 seconds max
    const timeoutId = setTimeout(() => {
      if (!isComplete) {
        console.warn('Dashboard loading timeout - forcing completion');
        usersLoaded = true;
        facilitiesLoaded = true;
        smsLoaded = true;
        isComplete = true;
        ensureMinimumLoadingTime(startTime, () => {
          this.loading = false;
          this.isLoadingData = false;
          this.cdr.detectChanges();
        });
      }
    }, 3000);
    
    // Load users
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.totalUsers = users.length;
        this.activeUsers = users.filter(u => u.isActive).length;
        this.allUsers = users;
        this.filteredUsers = users;
        usersLoaded = true;
        this.loadFacilities(startTime, checkComplete, () => { 
          facilitiesLoaded = true; 
          checkComplete(); 
        });
        checkComplete();
      },
      error: (error) => {
        console.info('Failed to load users:', error.status);
        usersLoaded = true;
        this.allUsers = [];
        this.filteredUsers = [];
        this.totalUsers = 0;
        this.activeUsers = 0;
        this.loadFacilities(startTime, checkComplete, () => { 
          facilitiesLoaded = true; 
          checkComplete(); 
        });
        checkComplete();
      }
    });
  }


  loadFacilities(startTime: number, checkComplete: () => void, onComplete: () => void): void {
    this.facilityService.getAllFacilities().subscribe({
      next: (facilities) => {
        this.facilities = facilities.map(f => ({
          ...f,
          userCount: this.allUsers.filter(u => u.facilityId === f.id).length,
          patientCount: 0 // TODO: Get from patients service
        }));
        this.activeFacilities = facilities.filter(f => f.active !== false).length;
        onComplete();
        this.loadSmsLogs(startTime, checkComplete);
      },
      error: (error) => {
        console.warn('Failed to load facilities:', error);
        this.facilities = [];
        this.activeFacilities = 0;
        onComplete();
        this.loadSmsLogs(startTime, checkComplete);
      }
    });
  }

  loadSmsLogs(startTime: number, checkComplete: () => void): void {
    this.smsService.getSmsLogs().subscribe({
      next: (logs) => {
        this.recentSmsLogs = logs.slice(0, 10);
        checkComplete();
      },
      error: (error) => {
        // SMS logs are optional, use empty array if it fails
        console.warn('Failed to load SMS logs:', error);
        this.recentSmsLogs = [];
        checkComplete();
      }
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = this.allUsers;
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.allUsers.filter(user => 
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      (user.firstName && user.firstName.toLowerCase().includes(query)) ||
      (user.lastName && user.lastName.toLowerCase().includes(query))
    );
  }

  openCreateForm(): void {
    // Navigate to users page with create form
    this.router.navigate(['/admin/users'], { queryParams: { action: 'create' } });
  }

  getUserInitials(user: User): string {
    const fullName = user.fullName || '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (fullName) {
      const parts = fullName.split(' ').filter(p => p.length > 0);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    
    return (user.username[0] || 'U').toUpperCase();
  }

  getUserDisplayName(user: User): string {
    return user.fullName || 
           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
           user.username;
  }

  getRoleDisplayName(role: string | any): string {
    const roleStr = String(role);
    const roleMap: { [key: string]: string } = {
      'HEALTH_WORKER': 'Vaccinator',
      'FACILITY_MANAGER': 'District Officer',
      'GOVERNMENT_OFFICER': 'Admin',
      'ADMIN': 'Admin',
      'VACCINATOR': 'Vaccinator',
      'DISTRICT_OFFICER': 'District Officer'
    };
    return roleMap[roleStr] || roleStr;
  }

  getRoleClass(role: string | any): string {
    const roleStr = String(role).toUpperCase();
    if (roleStr === 'GOVERNMENT_OFFICIAL') {
      return 'role-admin';
    } else if (roleStr === 'HEALTH_WORKER') {
      return 'role-vaccinator';
    } else if (roleStr === 'FACILITY_MANAGER') {
      return 'role-manager';
    } else {
      return 'role-officer';
    }
  }
}

