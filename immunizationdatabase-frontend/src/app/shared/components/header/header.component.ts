import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: any = null;
  notificationCount = 0;
  isOffline = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.checkOfflineStatus();

    // Check offline status periodically
    setInterval(() => this.checkOfflineStatus(), 5000);
  }

  checkOfflineStatus(): void {
    this.isOffline = !navigator.onLine;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return 'U';
    const names = this.currentUser.fullName.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  }

  getUserRole(): string {
    return this.currentUser?.role?.replace('_', ' ') || 'User';
  }

  getRoleClass(): string {
    if (!this.currentUser?.role) return 'role-default';
    const role = this.currentUser.role.toLowerCase();
    if (role.includes('health_worker')) return 'role-health-worker';
    if (role.includes('facility_manager')) return 'role-facility-manager';
    if (role.includes('government_official')) return 'role-government';
    return 'role-default';
  }

  getRoleIconSmall(): string {
    if (!this.currentUser?.role) return 'person';
    const role = this.currentUser.role.toLowerCase();
    if (role.includes('health_worker')) return 'local_hospital';
    if (role.includes('facility_manager')) return 'business';
    if (role.includes('government_official')) return 'account_balance';
    return 'person';
  }

  toggleSidebar(): void {
    this.menuToggle.emit();
  }
}
