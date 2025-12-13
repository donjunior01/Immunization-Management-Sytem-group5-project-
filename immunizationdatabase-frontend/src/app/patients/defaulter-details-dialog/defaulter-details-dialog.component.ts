import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

export interface DefaulterRecord {
  patientId: string;
  patientName: string;
  age: number;
  guardianName: string;
  phoneNumber: string;
  missedVaccine: string;
  dueDate: string;
  daysOverdue: number;
  urgency: 'critical' | 'high' | 'medium';
}

@Component({
  selector: 'app-defaulter-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="defaulter-details-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon class="warning-icon" [class]="data.urgency + '-icon'">
            {{ getUrgencyIcon(data.urgency) }}
          </mat-icon>
          <div>
            <h2 mat-dialog-title>Defaulter Details</h2>
            <p class="urgency-label" [class]="data.urgency">
              {{ data.urgency | uppercase }} URGENCY
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="details-grid">
          <!-- Patient Information -->
          <section class="detail-section">
            <h3 class="section-title">
              <mat-icon>person</mat-icon>
              Patient Information
            </h3>
            <mat-divider></mat-divider>
            
            <div class="detail-row">
              <span class="label">Patient ID:</span>
              <span class="value">{{ data.patientId }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Patient Name:</span>
              <span class="value">{{ data.patientName }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Age:</span>
              <span class="value">{{ data.age }} years</span>
            </div>
          </section>

          <!-- Guardian Information -->
          <section class="detail-section">
            <h3 class="section-title">
              <mat-icon>supervisor_account</mat-icon>
              Guardian Information
            </h3>
            <mat-divider></mat-divider>

            <div class="detail-row">
              <span class="label">Guardian Name:</span>
              <span class="value">{{ data.guardianName }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Phone Number:</span>
              <span class="value">
                <a [href]="'tel:' + data.phoneNumber" class="phone-link">
                  <mat-icon>phone</mat-icon>
                  {{ data.phoneNumber }}
                </a>
              </span>
            </div>
          </section>

          <!-- Vaccination Information -->
          <section class="detail-section full-width">
            <h3 class="section-title">
              <mat-icon>vaccines</mat-icon>
              Missed Vaccination
            </h3>
            <mat-divider></mat-divider>

            <div class="detail-row">
              <span class="label">Missed Vaccine:</span>
              <mat-chip-set>
                <mat-chip class="vaccine-chip" [highlighted]="true">
                  {{ data.missedVaccine }}
                </mat-chip>
              </mat-chip-set>
            </div>

            <div class="detail-row">
              <span class="label">Due Date:</span>
              <span class="value">{{ formatDate(data.dueDate) }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Days Overdue:</span>
              <span class="value overdue-value">
                {{ data.daysOverdue }} days
              </span>
            </div>
          </section>

          <!-- Urgency Alert -->
          <section class="detail-section full-width alert-section" [class]="data.urgency + '-alert'">
            <div class="alert-content">
              <mat-icon>{{ getUrgencyIcon(data.urgency) }}</mat-icon>
              <div>
                <h4>{{ getUrgencyMessage(data.urgency) }}</h4>
                <p>{{ getUrgencyDescription(data.urgency, data.daysOverdue) }}</p>
              </div>
            </div>
          </section>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
        <button mat-raised-button color="accent" (click)="onSendReminder()">
          <mat-icon>notifications</mat-icon>
          Send Reminder
        </button>
        <button mat-raised-button color="warn" (click)="onScheduleFollowUp()">
          <mat-icon>event</mat-icon>
          Schedule Follow-up
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .defaulter-details-dialog {
      min-width: 600px;
      max-width: 800px;

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e0e0e0;

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;

          .warning-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            
            &.critical-icon { color: #d32f2f; }
            &.high-icon { color: #ff9800; }
            &.medium-icon { color: #2196f3; }
          }

          h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #333;
          }

          .urgency-label {
            margin: 4px 0 0;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;

            &.critical { background: #ffebee; color: #d32f2f; }
            &.high { background: #fff3e0; color: #ff9800; }
            &.medium { background: #e3f2fd; color: #2196f3; }
          }
        }
      }

      mat-dialog-content {
        padding: 20px 24px;
        max-height: 600px;
        overflow-y: auto;

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;

          .detail-section {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;

            &.full-width {
              grid-column: 1 / -1;
            }

            &.alert-section {
              padding: 20px;
              
              &.critical-alert {
                background: #ffebee;
                border-left-color: #d32f2f;
              }
              
              &.high-alert {
                background: #fff3e0;
                border-left-color: #ff9800;
              }
              
              &.medium-alert {
                background: #e3f2fd;
                border-left-color: #2196f3;
              }

              .alert-content {
                display: flex;
                align-items: center;
                gap: 16px;

                mat-icon {
                  font-size: 48px;
                  width: 48px;
                  height: 48px;
                }

                h4 {
                  margin: 0 0 8px;
                  font-size: 16px;
                  font-weight: 600;
                }

                p {
                  margin: 0;
                  font-size: 14px;
                }
              }
            }

            .section-title {
              display: flex;
              align-items: center;
              gap: 8px;
              margin: 0 0 12px;
              font-size: 16px;
              font-weight: 600;
              color: #2196f3;
            }

            mat-divider {
              margin-bottom: 16px;
            }

            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;

              &:last-child {
                border-bottom: none;
                padding-bottom: 0;
              }

              .label {
                font-weight: 500;
                color: #666;
                font-size: 14px;
              }

              .value {
                font-weight: 400;
                color: #333;
                font-size: 14px;
                text-align: right;

                &.overdue-value {
                  color: #d32f2f;
                  font-weight: 600;
                }
              }

              .phone-link {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #2196f3;
                text-decoration: none;
                transition: color 0.3s;

                mat-icon {
                  font-size: 18px;
                  width: 18px;
                  height: 18px;
                }

                &:hover {
                  color: #1565c0;
                  text-decoration: underline;
                }
              }

              mat-chip-set {
                mat-chip.vaccine-chip {
                  background-color: #2196f3 !important;
                  color: white !important;
                  font-weight: 600;
                }
              }
            }
          }
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
      .defaulter-details-dialog {
        min-width: 90vw;

        mat-dialog-content {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  `]
})
export class DefaulterDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DefaulterDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DefaulterRecord
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onSendReminder(): void {
    this.dialogRef.close({ action: 'send-reminder' });
  }

  onScheduleFollowUp(): void {
    this.dialogRef.close({ action: 'schedule-followup' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getUrgencyIcon(urgency: string): string {
    const icons: { [key: string]: string } = {
      critical: 'error',
      high: 'warning',
      medium: 'info'
    };
    return icons[urgency] || 'info';
  }

  getUrgencyMessage(urgency: string): string {
    const messages: { [key: string]: string } = {
      critical: 'Critical Intervention Required!',
      high: 'High Priority Follow-up Needed',
      medium: 'Follow-up Recommended'
    };
    return messages[urgency] || '';
  }

  getUrgencyDescription(urgency: string, daysOverdue: number): string {
    const descriptions: { [key: string]: string } = {
      critical: `This patient is ${daysOverdue} days overdue. Immediate action is required to prevent serious health risks.`,
      high: `The vaccination is ${daysOverdue} days overdue. Please contact the guardian as soon as possible.`,
      medium: `The vaccination is ${daysOverdue} days overdue. A reminder should be sent to the guardian.`
    };
    return descriptions[urgency] || '';
  }
}
