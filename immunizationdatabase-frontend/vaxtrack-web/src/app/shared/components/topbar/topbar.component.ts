import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() sidebarCollapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleNotifications = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  
  currentUser: User | null = null;
  notificationCount: number = 0;
  searchQuery: string = '';
  showProfileDropdown: boolean = false;
  showNotificationsDropdown: boolean = false;
  showRecentSearches: boolean = false;
  recentSearches: string[] = [];
  showLogoutConfirm: boolean = false;
  
  // Notifications data
  notifications: Array<{id: string, type: string, title: string, time: string, read: boolean}> = [];

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Load notifications - replace with actual service
    this.loadNotifications();
  }
  
  ngOnDestroy(): void {
    // Cleanup
  }

  // Click outside handler to close dropdowns
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const topbar = this.elementRef.nativeElement;
    
    // Check if click is outside the topbar component or on a non-dropdown element
    if (!topbar.contains(target)) {
      this.closeDropdowns();
    }
  }
  
  private loadNotifications(): void {
    // Simulated notifications - replace with actual API call
    this.notifications = [
      { id: '1', type: 'error', title: 'Measles vaccine out of stock', time: '2 hours ago', read: false },
      { id: '2', type: 'warning', title: 'Penta stock below reorder point', time: '5 hours ago', read: false },
      { id: '3', type: 'info', title: 'OPV batch expiring in 14 days', time: 'Yesterday', read: true }
    ];
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onToggleNotifications(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    this.showProfileDropdown = false; // Close profile dropdown
    this.toggleNotifications.emit();
  }

  onProfileClick(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotificationsDropdown = false; // Close notifications dropdown
  }

  hideRecentSearches(): void {
    setTimeout(() => {
      this.showRecentSearches = false;
    }, 200);
  }
  
  // Navigation methods for dropdown items
  navigateToProfile(): void {
    this.closeDropdowns();
    const role = this.currentUser?.role;
    if (role === 'HEALTH_WORKER' || role === 'VACCINATOR') {
      this.router.navigate(['/vaccinator/dashboard']);
    } else if (role === 'FACILITY_MANAGER') {
      this.router.navigate(['/manager/dashboard']);
    } else if (role === 'GOVERNMENT_OFFICIAL') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
  
  navigateToSettings(): void {
    this.closeDropdowns();
    const role = this.currentUser?.role;
    if (role === 'GOVERNMENT_OFFICIAL' || role === 'FACILITY_MANAGER') {
      this.router.navigate(['/admin/settings']);
    } else {
      // For health workers, navigate to their dashboard (no dedicated settings page)
      this.router.navigate(['/vaccinator/dashboard']);
    }
  }
  
  navigateToHelp(): void {
    this.closeDropdowns();
    // Navigate to help page or open help modal
    this.router.navigate(['/landing']);
  }
  
  navigateToAlerts(): void {
    this.closeNotifications();
    const role = this.currentUser?.role;
    if (role === 'FACILITY_MANAGER') {
      this.router.navigate(['/manager/alerts']);
    } else if (role === 'HEALTH_WORKER' || role === 'VACCINATOR') {
      this.router.navigate(['/vaccinator/stock']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }
  
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }
  
  markNotificationAsRead(notification: any): void {
    notification.read = true;
    this.notificationCount = this.notifications.filter(n => !n.read).length;
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

