import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/api/v1/reports`;

  constructor(private http: HttpClient) {}

  getCoverageReport(facilityId: string, startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/coverage`, {
      params: { facility_id: facilityId, start_date: startDate, end_date: endDate }
    });
  }

  getDefaulterReport(facilityId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/defaulters`, {
      params: { facilityId }
    });
  }

  getStockReport(facilityId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/stock`, {
      params: { facilityId }
    });
  }

  exportReport(reportType: string, params: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, params, {
      responseType: 'blob'
    });
  }

  exportData(facilityId: string | undefined, startDate: string, endDate: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, { facilityId, startDate, endDate }, {
      responseType: 'blob'
    });
  }

  getNationalStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/national-stats`);
  }

  getDashboardStats(facilityId?: string): Observable<any> {
    if (facilityId) {
      return this.http.get(`${this.apiUrl}/dashboard/${facilityId}`);
    }
    return this.http.get(`${this.apiUrl}/dashboard-stats`);
  }
}
