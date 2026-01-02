import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

export interface SidebarItem {
  label: string;
  route: string;
  icon: string;
  active?: boolean;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() user: User | null = null;
  @Input() roleLabel: string = '';
  @Input() collapsed: boolean = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  showLogoutConfirm: boolean = false;

  constructor(private authService: AuthService) {}

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  logout(): void {
    this.showLogoutConfirm = true;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  getUserInitials(): string {
    if (!this.user) return 'U';
    const fullName = this.user.fullName || '';
    const firstName = this.user.firstName || '';
    const lastName = this.user.lastName || '';
    
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
    
    return (this.user.username[0] || 'U').toUpperCase();
  }

  getUserDisplayName(): string {
    if (!this.user) return 'User';
    return this.user.fullName || 
           (this.user.firstName && this.user.lastName ? `${this.user.firstName} ${this.user.lastName}` : '') ||
           this.user.username;
  }

  getFacilityName(): string {
    return this.user?.facilityName || this.user?.facilityId || 'Facility';
  }
}



