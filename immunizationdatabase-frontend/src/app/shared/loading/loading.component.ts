import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay" *ngIf="show">
      <div class="loading-spinner">
        <div class="loader"></div>
        <p class="loading-text">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-spinner {
      background: var(--white);
      padding: 40px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      text-align: center;
      min-width: 200px;
    }

    .loader {
      border: 4px solid var(--gray);
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      margin: 0;
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 500;
    }
  `]
})
export class LoadingComponent {
  @Input() show: boolean = false;
  @Input() message: string = 'Loading...';
}
