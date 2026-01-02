import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';

@Component({
  selector: 'app-district-coverage',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout pageTitle="Coverage Analysis" pageSubtitle="Detailed vaccination coverage analysis">
      <div class="page-content">
        <p>Coverage analysis page - Coming soon</p>
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
export class DistrictCoverageComponent {}


