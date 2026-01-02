import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  @Input() sidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();

  private authService = inject(AuthService);
  
  currentUser: User | null = null;
  notificationCount: number = 0;
  searchQuery: string = '';
  showProfileDropdown: boolean = false;
  showNotificationsDropdown: boolean = false;
  showRecentSearches: boolean = false;
  recentSearches: string[] = [];
  showLogoutConfirm: boolean = false;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Simulate notification count - replace with actual service
    this.notificationCount = 3;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleNotifications(): void {
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    this.toggleNotifications.emit();
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    // Implement search logic
  }

  onProfileClick(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  hideRecentSearches(): void {
    setTimeout(() => {
      this.showRecentSearches = false;
    }, 200);
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    const fullName = this.currentUser.fullName || '';
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    
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
    
    return (this.currentUser.username[0] || 'U').toUpperCase();
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';
    return this.currentUser.fullName || 
           (this.currentUser.firstName && this.currentUser.lastName ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : '') ||
           this.currentUser.username;
  }

  getUserRole(): string {
    if (!this.currentUser) return '';
    const role = this.currentUser.role as string;
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'Admin',
      'FACILITY_MANAGER': 'Facility Manager',
      'VACCINATOR': 'Vaccinator',
      'HEALTH_WORKER': 'Health Worker',
      'DISTRICT_OFFICER': 'District Officer',
      'GOVERNMENT_OFFICER': 'Government Officer'
    };
    return roleMap[role] || role;
  }

  logout(): void {
    this.showProfileDropdown = false;
    this.showLogoutConfirm = true;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  closeDropdowns(): void {
    this.showProfileDropdown = false;
    this.showNotificationsDropdown = false;
  }

  closeNotifications(): void {
    this.showNotificationsDropdown = false;
  }

  closeProfile(): void {
    this.showProfileDropdown = false;
  }
}

