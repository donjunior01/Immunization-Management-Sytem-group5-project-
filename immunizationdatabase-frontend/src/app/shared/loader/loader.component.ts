import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoaderService } from '../../services/loader.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loader-overlay" *ngIf="loading$ | async">
      <div class="loader-container">
        <mat-spinner diameter="60" strokeWidth="4"></mat-spinner>
        <p class="loader-text">Loading...</p>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-in;
    }

    .loader-container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      animation: slideIn 0.3s ease-out;
    }

    .loader-text {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #1976d2;
      letter-spacing: 0.5px;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    ::ng-deep .loader-overlay .mat-mdc-progress-spinner {
      --mdc-circular-progress-active-indicator-color: #1976d2;
    }
  `]
})
export class LoaderComponent implements OnInit {
  loading$: Observable<boolean>;

  constructor(private loaderService: LoaderService) {
    this.loading$ = this.loaderService.loading$;
  }

  ngOnInit(): void {}
}
