import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SmsLog, SmsLogFilter } from '../models/sms.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getSmsLogs(filter?: SmsLogFilter): Observable<SmsLog[]> {
    let params = new HttpParams();
    if (filter?.startDate && filter.startDate.trim() !== '') {
      params = params.set('startDate', filter.startDate);
    }
    if (filter?.endDate && filter.endDate.trim() !== '') {
      params = params.set('endDate', filter.endDate);
    }
    if (filter?.status && filter.status.trim() !== '') {
      params = params.set('status', filter.status);
    }
    if (filter?.recipientPhone && filter.recipientPhone.trim() !== '') {
      params = params.set('recipient_phone', filter.recipientPhone);
    }
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sms.service.ts:getSmsLogs',message:'Calling SMS logs API',data:{url:`${this.apiUrl}/api/sms-logs`,hasFilter:!!filter,paramsCount:params.keys().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'SMS_LOADING'})}).catch(()=>{});
    // #endregion
    return this.http.get<any[]>(`${this.apiUrl}/api/sms-logs`, { params }).pipe(
      map((logs: any[]) => logs.map(log => ({
        id: String(log.id || ''),
        recipientPhone: log.recipientPhone || '',
        message: log.message || '',
        status: log.status || 'PENDING',
        sentAt: log.sentAt || '',
        errorMessage: log.errorMessage || '',
        appointmentId: log.appointmentId || '',
        patientId: log.patientId || ''
      })))
    );
  }

  getSmsLogById(id: string): Observable<SmsLog> {
    return this.http.get<SmsLog>(`${this.apiUrl}/api/sms-logs/${id}`);
  }
}

