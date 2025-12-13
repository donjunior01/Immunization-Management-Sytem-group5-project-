import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DeleteConfirmationData {
  title: string;
  message: string;
  entityName: string;
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="delete-dialog">
      <div class="dialog-header">
        <mat-icon class="warning-icon">warning</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <mat-dialog-content>
        <p class="dialog-message">{{ data.message }}</p>
        <p class="entity-name">"{{ data.entityName }}"</p>
        <p class="warning-text">This action cannot be undone.</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="warn" (click)="onConfirm()">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;

        .warning-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #ff9800;
        }

        h2 {
          margin: 0;
          color: #333;
        }
      }

      mat-dialog-content {
        padding: 0 24px 20px;

        .dialog-message {
          margin: 0 0 12px;
          color: #555;
          font-size: 15px;
        }

        .entity-name {
          margin: 0 0 16px;
          padding: 12px;
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          font-weight: 600;
          color: #333;
          border-radius: 4px;
        }

        .warning-text {
          margin: 0;
          color: #d32f2f;
          font-weight: 500;
          font-size: 14px;
        }
      }

      mat-dialog-actions {
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        gap: 12px;

        button {
          font-weight: 600;

          mat-icon {
            margin-right: 4px;
          }
        }
      }
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
