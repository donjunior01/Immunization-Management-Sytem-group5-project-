import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderService } from '../../services/loader.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

interface FacilityProfile {
  id: string;
  name: string;
  type: string;
  district: string;
  region: string;
  status: string;
  established: string;
}

interface FacilityStats {
  totalPatients: number;
  vaccinationsThisMonth: number;
  activeStaff: number;
  vaccineBatches: number;
  coverageRate: number;
  stockLevel: number;
}

interface PerformanceMetric {
  label: string;
  value: number;
  target: number;
  icon: string;
  color: string;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  status: string;
  joinedDate: string;
}

@Component({
  selector: 'app-facility-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './facility-profile.component.html',
  styleUrls: ['./facility-profile.component.scss']
})
export class FacilityProfileComponent implements OnInit {
  facility: FacilityProfile | null = null;
  stats: FacilityStats = {
    totalPatients: 0,
    vaccinationsThisMonth: 0,
    activeStaff: 0,
    vaccineBatches: 0,
    coverageRate: 0,
    stockLevel: 0
  };

  performanceMetrics: PerformanceMetric[] = [];
  staffMembers: StaffMember[] = [];
  displayedColumns: string[] = ['name', 'role', 'status', 'joinedDate'];

  constructor(
    private loaderService: LoaderService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFacilityProfile();
  }

  loadFacilityProfile(): void {
    this.loaderService.show();
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      const facilityId = currentUser?.facilityId || 'FAC001';

      // Mock data - in production, this would be API calls
      this.facility = {
        id: facilityId,
        name: 'Central Health Facility',
        type: 'Health Center',
        district: 'Nairobi Central',
        region: 'Nairobi County',
        status: 'ACTIVE',
        established: '2015-03-15'
      };

      this.stats = {
        totalPatients: 1247,
        vaccinationsThisMonth: 342,
        activeStaff: 8,
        vaccineBatches: 15,
        coverageRate: 87.5,
        stockLevel: 78.2
      };

      this.performanceMetrics = [
        {
          label: 'Vaccination Coverage',
          value: 87.5,
          target: 95,
          icon: 'vaccines',
          color: '#11998e'
        },
        {
          label: 'Patient Registration',
          value: 92.3,
          target: 90,
          icon: 'person_add',
          color: '#667eea'
        },
        {
          label: 'Stock Management',
          value: 78.2,
          target: 85,
          icon: 'inventory_2',
          color: '#f093fb'
        },
        {
          label: 'Data Accuracy',
          value: 95.8,
          target: 95,
          icon: 'check_circle',
          color: '#38ef7d'
        }
      ];

      this.staffMembers = [
        {
          id: 1,
          name: 'Health Worker',
          role: 'Health Worker',
          status: 'Active',
          joinedDate: '2024-01-15'
        },
        {
          id: 2,
          name: 'Jane Nurse',
          role: 'Health Worker',
          status: 'Active',
          joinedDate: '2024-05-20'
        },
        {
          id: 3,
          name: 'John Worker',
          role: 'Health Worker',
          status: 'Inactive',
          joinedDate: '2024-02-28'
        }
      ];
    }, 1000);
  }

  getStatusColor(): string {
    return this.facility?.status === 'ACTIVE' ? 'success' : 'warn';
  }

  getStatusIcon(): string {
    return this.facility?.status === 'ACTIVE' ? 'check_circle' : 'error';
  }

  getPerformanceColor(value: number, target: number): string {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return '#38ef7d';
    if (percentage >= 80) return '#f093fb';
    if (percentage >= 60) return '#ffa726';
    return '#ef5350';
  }

  getPerformanceStatus(value: number, target: number): string {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  navigateToSettings(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.router.navigate(['/facility-settings']);
    }, 1000);
  }

  navigateToUserManagement(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.router.navigate(['/user-management']);
    }, 1000);
  }

  navigateToInventory(): void {
    this.loaderService.show();
    setTimeout(() => {
      this.router.navigate(['/inventory']);
    }, 1000);
  }

  exportReport(): void {
    this.loaderService.show();
    setTimeout(() => {
      const report = {
        facility: this.facility,
        stats: this.stats,
        metrics: this.performanceMetrics,
        staff: this.staffMembers,
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facility-profile-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      this.notificationService.success('Facility profile exported successfully');
    }, 1000);
  }

  getStaffStatusClass(status: string): string {
    return status === 'Active' ? 'status-active' : 'status-inactive';
  }

  getYearsEstablished(): number {
    if (!this.facility?.established) return 0;
    const established = new Date(this.facility.established);
    const now = new Date();
    return now.getFullYear() - established.getFullYear();
  }
}
