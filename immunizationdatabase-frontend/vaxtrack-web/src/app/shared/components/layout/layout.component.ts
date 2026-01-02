import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';
import { SidebarComponent, SidebarItem } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, TopbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  @Input() pageTitle: string = 'Dashboard';
  @Input() pageSubtitle: string = '';
  
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser$: Observable<User | null> = this.authService.currentUser$;
  currentUser: User | null = null;
  sidebarItems: SidebarItem[] = [];
  roleLabel: string = '';
  sidebarCollapsed: boolean = false;

  ngOnInit(): void {
    this.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.setupSidebar(user);
      }
    });
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  private setupSidebar(user: User): void {
    const role = (user.role as string).toUpperCase();
    
    if (role === 'GOVERNMENT_OFFICIAL') {
      this.roleLabel = 'Government Official';
      this.sidebarItems = [
        { label: 'Dashboard', route: '/district/dashboard', icon: '📊' },
        { label: 'Facilities', route: '/district/facilities', icon: '🏥' },
        { label: 'Stock', route: '/district/stock', icon: '📦' },
        { label: 'Campaigns', route: '/district/campaigns', icon: '📢' },
        { label: 'Reports', route: '/district/reports/coverage', icon: '📈' },
        { label: 'SMS Logs', route: '/district/sms', icon: '📱' }
      ];
    } else if (role === 'HEALTH_WORKER') {
      this.roleLabel = 'Health Worker';
      this.sidebarItems = [
        { label: 'Dashboard', route: '/vaccinator/dashboard', icon: '📊' },
        { label: 'Register Patient', route: '/vaccinator/patients/register', icon: '➕' },
        { label: 'Vaccinations', route: '/vaccinator/vaccinations', icon: '💉' },
        { label: "Today's Appointments", route: '/vaccinator/appointments/today', icon: '📅' },
        { label: 'Vaccine Stock', route: '/vaccinator/stock', icon: '📦' },
        { label: 'Reports', route: '/vaccinator/reports', icon: '📈' }
      ];
    } else if (role === 'FACILITY_MANAGER') {
      this.roleLabel = 'Facility Manager';
      this.sidebarItems = [
        { label: 'Dashboard', route: '/manager/dashboard', icon: '📊' },
        { label: 'Patients', route: '/manager/patients', icon: '👥' },
        { label: 'Vaccinations', route: '/manager/vaccinations', icon: '💉' },
        { label: 'Stock Management', route: '/manager/stock', icon: '📦' },
        { label: 'Staff Management', route: '/manager/staff', icon: '👨‍⚕️' },
        { label: 'Appointments', route: '/manager/appointments', icon: '📅' },
        { label: 'Reports', route: '/manager/reports', icon: '📈' },
        { label: 'SMS Logs', route: '/district/sms', icon: '📱' },
        { label: 'Alerts & Notifications', route: '/manager/alerts', icon: '🔔' }
      ];
    }
  }
}
