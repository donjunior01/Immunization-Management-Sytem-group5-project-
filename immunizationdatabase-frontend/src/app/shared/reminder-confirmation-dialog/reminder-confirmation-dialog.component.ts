import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ReminderData {
  patientName: string;
  guardianName: string;
  phoneNumber: string;
  missedVaccine: string;
}

@Component({
  selector: 'app-reminder-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="reminder-dialog">
      <div class="dialog-header">
        <mat-icon class="notification-icon">notifications_active</mat-icon>
        <h2 mat-dialog-title>Send Vaccination Reminder</h2>
      </div>

      <mat-dialog-content>
        <p class="dialog-message">
          You are about to send a vaccination reminder to:
        </p>
        
        <div class="reminder-details">
          <div class="detail-row">
            <mat-icon>person</mat-icon>
            <div>
              <strong>Patient:</strong>
              <span>{{ data.patientName }}</span>
            </div>
          </div>

          <div class="detail-row">
            <mat-icon>supervisor_account</mat-icon>
            <div>
              <strong>Guardian:</strong>
              <span>{{ data.guardianName }}</span>
            </div>
          </div>

          <div class="detail-row">
            <mat-icon>phone</mat-icon>
            <div>
              <strong>Phone:</strong>
              <span>{{ data.phoneNumber }}</span>
            </div>
          </div>

          <div class="detail-row">
            <mat-icon>vaccines</mat-icon>
            <div>
              <strong>Missed Vaccine:</strong>
              <span class="vaccine-highlight">{{ data.missedVaccine }}</span>
            </div>
          </div>
        </div>

        <p class="confirmation-text">
          The reminder will be sent via SMS to the guardian's phone number.
          <br>Do you want to proceed?
        </p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="accent" (click)="onConfirm()">
          <mat-icon>send</mat-icon>
          Send Reminder
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .reminder-dialog {
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;

        .notification-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #2196f3;
        }

        h2 {
          margin: 0;
          color: #333;
        }
      }

      mat-dialog-content {
        padding: 0 24px 20px;
        min-width: 500px;

        .dialog-message {
          margin: 0 0 20px;
          color: #555;
          font-size: 15px;
        }

        .reminder-details {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;

          .detail-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;

            &:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }

            mat-icon {
              color: #2196f3;
              font-size: 24px;
              width: 24px;
              height: 24px;
            }

            div {
              flex: 1;
              display: flex;
              gap: 8px;

              strong {
                color: #666;
                min-width: 100px;
              }

              span {
                color: #333;

                &.vaccine-highlight {
                  color: #2196f3;
                  font-weight: 600;
                }
              }
            }
          }
        }

        .confirmation-text {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.6;
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

    @media (max-width: 768px) {
      .reminder-dialog {
        mat-dialog-content {
          min-width: 90vw;
        }
      }
    }
  `]
})
export class ReminderConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReminderConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReminderData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
