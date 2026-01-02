import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout pageTitle="Settings" pageSubtitle="Configure system settings">
      <div class="page-content">
        <p>Settings page - Coming soon</p>
      </div>
    </app-layout>
  `,
  styles: [`
    .page-content {
      padding: 2rem;
      text-align: center;
      color: #6c757d;
    }
  `]
})
export class AdminSettingsComponent {}


