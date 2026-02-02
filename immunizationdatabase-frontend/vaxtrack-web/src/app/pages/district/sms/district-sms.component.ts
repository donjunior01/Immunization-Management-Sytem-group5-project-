import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../../shared/components/layout/layout.component';
import { SmsService } from '../../../core/services/sms.service';
import { SmsLog, SmsLogFilter } from '../../../core/models/sms.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { Subscription, timeout, catchError, of } from 'rxjs';

@Component({
  selector: 'app-district-sms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LayoutComponent, LoaderComponent, AlertComponent, DatePipe],
  templateUrl: './district-sms.component.html',
  styleUrl: './district-sms.component.scss'
})
export class DistrictSmsComponent implements OnInit, OnDestroy {
  smsLogs: SmsLog[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  filterForm: FormGroup;
  sendSmsForm: FormGroup;
  showSendModal = false;
  sendingSms = false;
  showDeleteModal = false;
  deletingSms = false;
  smsToDelete: SmsLog | null = null;
  private subscription?: Subscription;
  private loadingTimeout?: any;

  constructor(
    private smsService: SmsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      status: [''],
      recipientPhone: ['']
    });
    this.sendSmsForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      message: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadSmsLogs();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  loadSmsLogs(): void {
    this.loading = true;
    this.errorMessage = '';
const filter: SmsLogFilter = {};
    
    if (this.filterForm.value.startDate) {
      filter.startDate = new Date(this.filterForm.value.startDate).toISOString();
    }
    if (this.filterForm.value.endDate) {
      filter.endDate = new Date(this.filterForm.value.endDate).toISOString();
    }
    if (this.filterForm.value.status) {
      filter.status = this.filterForm.value.status;
    }
    if (this.filterForm.value.recipientPhone) {
      filter.recipientPhone = this.filterForm.value.recipientPhone;
    }
// Set a safety timeout to prevent infinite loading
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
this.loading = false;
        this.errorMessage = 'Request timed out. Please try again.';
      }
    }, 10000); // 10 second timeout

    // Unsubscribe from previous subscription if exists
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.smsService.getSmsLogs(filter).pipe(
      timeout(8000), // 8 second timeout for the HTTP request
      catchError((error) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        this.loading = false;
        if (error.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out. Please try again.';
        } else {
          this.errorMessage = error?.error?.message || error?.message || 'Failed to load SMS logs. Please try again.';
        }
        this.cdr.detectChanges();
        return of([]); // Return empty array on error
      })
    ).subscribe({
      next: (logs) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        this.smsLogs = logs || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        console.error('Failed to load SMS logs:', error);
        this.errorMessage = error?.error?.message || error?.message || 'Failed to load SMS logs. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterSubmit(): void {
    this.loadSmsLogs();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadSmsLogs();
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return 'status-sent';
      case 'FAILED':
        return 'status-failed';
      case 'PENDING':
        return 'status-pending';
      default:
        return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return '✓';
      case 'FAILED':
        return '✗';
      case 'PENDING':
        return '⏳';
      default:
        return '?';
    }
  }

  openSendModal(): void {
    this.showSendModal = true;
    this.sendSmsForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeSendModal(): void {
    this.showSendModal = false;
    this.sendSmsForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSendSms(): void {
    if (this.sendSmsForm.invalid || this.sendingSms) {
      this.sendSmsForm.markAllAsTouched();
      return;
    }

    this.sendingSms = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.sendSmsForm.value;
this.smsService.sendSms(formValue.phone, formValue.message).subscribe({
      next: (smsLog) => {
this.sendingSms = false;
        // Show success message even if SMS gateway failed (message is logged)
        if (smsLog.status === 'SENT') {
          this.successMessage = 'SMS sent successfully!';
        } else if (smsLog.status === 'FAILED') {
          this.successMessage = 'SMS logged but gateway failed. Check SMS logs for details.';
        } else {
          this.successMessage = 'SMS request logged.';
        }
        this.closeSendModal();
        // Reload SMS logs to show the new message
        setTimeout(() => {
          this.loadSmsLogs();
        }, 500);
      },
      error: (error) => {
this.sendingSms = false;
        // Even if there's an error, reload logs in case the message was saved
        this.errorMessage = error?.error?.message || error?.message || 'Failed to send SMS. Please try again.';
        console.error('Failed to send SMS:', error);
        // Still reload logs in case the message was saved to database
        setTimeout(() => {
          this.loadSmsLogs();
        }, 1000);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.sendSmsForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'phone' ? 'Phone number' : 'Message'} is required`;
      }
      if (field.errors['pattern']) {
        return 'Invalid phone number format';
      }
      if (field.errors['minlength']) {
        return 'Message is too short';
      }
      if (field.errors['maxlength']) {
        return 'Message is too long (max 500 characters)';
      }
    }
    return '';
  }

  openDeleteModal(smsLog: SmsLog): void {
    this.smsToDelete = smsLog;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.smsToDelete = null;
    this.errorMessage = '';
  }

  confirmDelete(): void {
    if (!this.smsToDelete || this.deletingSms) {
      return;
    }

    this.deletingSms = true;
    this.errorMessage = '';
this.smsService.deleteSmsLog(this.smsToDelete.id).subscribe({
      next: () => {
this.deletingSms = false;
        this.closeDeleteModal();
        this.successMessage = 'SMS log deleted successfully.';
        setTimeout(() => {
          this.successMessage = '';
          this.loadSmsLogs();
        }, 1500);
      },
      error: (error) => {
this.deletingSms = false;
        this.errorMessage = error?.error?.message || error?.message || 'Failed to delete SMS log. Please try again.';
        console.error('Failed to delete SMS log:', error);
      }
    });
  }
}
