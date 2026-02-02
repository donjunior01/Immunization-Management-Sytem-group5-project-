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
return this.http.get<any[]>(`${this.apiUrl}/sms-logs`, { params }).pipe(
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
    return this.http.get<SmsLog>(`${this.apiUrl}/sms-logs/${id}`);
  }

  sendSms(phone: string, message: string): Observable<SmsLog> {
return this.http.post<any>(`${this.apiUrl}/sms-logs/send`, { phone, message }).pipe(
      map((response: any) => ({
        id: String(response.id || ''),
        recipientPhone: response.recipientPhone || '',
        message: response.message || '',
        status: (response.status || 'PENDING') as 'SENT' | 'FAILED' | 'PENDING',
        sentAt: response.sentAt || '',
        errorMessage: response.errorMessage || '',
        appointmentId: response.appointmentId || '',
        patientId: response.patientId || ''
      }))
    );
  }

  deleteSmsLog(id: string): Observable<void> {
return this.http.delete<void>(`${this.apiUrl}/sms-logs/${id}`);
  }
}

