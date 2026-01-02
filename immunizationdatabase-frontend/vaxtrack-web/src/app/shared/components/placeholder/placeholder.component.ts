import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../layout/layout.component';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, LayoutComponent],
  template: `
    <app-layout [pageTitle]="title">
      <div class="placeholder-page">
        <div class="placeholder-content">
          <div class="placeholder-icon">{{ icon }}</div>
          <h2>{{ title }}</h2>
          <p>{{ message }}</p>
          <p class="coming-soon">This page is under development</p>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .placeholder-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }
    .placeholder-content {
      text-align: center;
      max-width: 500px;
    }
    .placeholder-icon {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }
    h2 {
      font-size: 2rem;
      font-weight: 600;
      color: var(--gray-900);
      margin-bottom: var(--space-3);
    }
    p {
      color: var(--gray-600);
      margin-bottom: var(--space-2);
    }
    .coming-soon {
      color: var(--gray-500);
      font-style: italic;
    }
  `]
})
export class PlaceholderComponent {
  @Input() title = 'Page Under Development';
  @Input() message = 'This feature is currently being developed.';
  @Input() icon = '🚧';
}






