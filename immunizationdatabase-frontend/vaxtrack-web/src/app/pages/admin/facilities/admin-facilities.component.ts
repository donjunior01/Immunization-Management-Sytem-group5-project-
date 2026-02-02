import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-admin-facilities',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout pageTitle="Facilities Management" pageSubtitle="Manage health facilities in the system">
      <div class="page-content">
        <p>Facilities management page - Coming soon</p>
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
export class AdminFacilitiesComponent {}

