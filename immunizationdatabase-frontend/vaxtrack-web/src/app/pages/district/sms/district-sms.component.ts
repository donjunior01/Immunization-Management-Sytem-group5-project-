import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  filterForm: FormGroup;
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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs',message:'Starting SMS logs load',data:{hasStartDate:!!this.filterForm.value.startDate,hasEndDate:!!this.filterForm.value.endDate,hasStatus:!!this.filterForm.value.status,hasPhone:!!this.filterForm.value.recipientPhone},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs',message:'Before API call',data:{filter:filter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
    // #endregion

    // Set a safety timeout to prevent infinite loading
    this.loadingTimeout = setTimeout(() => {
      if (this.loading) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs:timeout',message:'Loading timeout triggered',data:{loading:this.loading},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
        // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs:catchError',message:'Error in pipe',data:{error:error?.message||'Unknown',name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
        // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs:next',message:'SMS logs received',data:{logsCount:logs?.length||0,logs:logs},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
        // #endregion
        if (this.loadingTimeout) {
          clearTimeout(this.loadingTimeout);
        }
        this.smsLogs = logs || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'district-sms.component.ts:loadSmsLogs:error',message:'SMS logs error',data:{error:error?.message||'Unknown',status:error?.status,statusText:error?.statusText,url:error?.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
        // #endregion
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
}
