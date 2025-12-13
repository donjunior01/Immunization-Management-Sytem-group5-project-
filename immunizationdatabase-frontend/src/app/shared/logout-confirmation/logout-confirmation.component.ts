import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logout-confirmation',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="logout-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>Confirm Logout</h2>
      </div>
      
      <mat-dialog-content>
        <p class="dialog-message">
          Are you sure you want to logout? Any unsaved changes will be lost.
        </p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" class="cancel-btn">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="warn" (click)="onConfirm()" class="confirm-btn">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .logout-dialog {
      padding: 8px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .warning-icon {
      color: #FFA500;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    mat-dialog-content {
      padding: 0 0 24px 0;
    }

    .dialog-message {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin: 0;
    }

    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 12px;
    }

    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
    }

    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #DC3545 0%, #BD2130 100%);
      color: white;
    }

    button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class LogoutConfirmationComponent {
  constructor(public dialogRef: MatDialogRef<LogoutConfirmationComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
