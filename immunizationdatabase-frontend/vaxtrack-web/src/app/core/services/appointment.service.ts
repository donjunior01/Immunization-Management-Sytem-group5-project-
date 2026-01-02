import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, timeout, catchError } from 'rxjs/operators';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAppointments(facilityId?: string, date?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (facilityId) params = params.set('facilityId', facilityId);
    if (date) params = params.set('date', date);
    return this.http.get<any[]>(`${this.apiUrl}/api/appointments`, { params }).pipe(
      timeout(8000), // 8 second timeout
      map((responses: any[]) => responses.map(response => this.mapBackendToFrontend(response))),
      catchError(error => {
        console.error('Error fetching appointments:', error);
        return throwError(() => error);
      })
    );
  }

  private mapBackendToFrontend(response: any): Appointment {
    // Convert LocalDate to string format (YYYY-MM-DD)
    let appointmentDate = '';
    if (response.appointmentDate) {
      if (typeof response.appointmentDate === 'string') {
        appointmentDate = response.appointmentDate;
      } else if (response.appointmentDate.year && response.appointmentDate.month && response.appointmentDate.day) {
        // Handle LocalDate object from backend
        const year = response.appointmentDate.year;
        const month = String(response.appointmentDate.monthValue || response.appointmentDate.month).padStart(2, '0');
        const day = String(response.appointmentDate.dayOfMonth || response.appointmentDate.day).padStart(2, '0');
        appointmentDate = `${year}-${month}-${day}`;
      }
    }

    // Convert LocalTime to string format (HH:mm)
    let appointmentTime: string | undefined = undefined;
    if (response.appointmentTime) {
      if (typeof response.appointmentTime === 'string') {
        appointmentTime = response.appointmentTime;
      } else if (response.appointmentTime.hour !== undefined) {
        // Handle LocalTime object from backend
        const hour = String(response.appointmentTime.hour).padStart(2, '0');
        const minute = String(response.appointmentTime.minute || 0).padStart(2, '0');
        appointmentTime = `${hour}:${minute}`;
      }
    }

    return {
      id: response.id ? String(response.id) : '',
      patientId: response.patientId ? String(response.patientId) : '',
      patientName: response.patientName || 'Unknown',
      patientAge: response.patientAge || undefined,
      guardianName: response.guardianName || undefined,
      guardianPhone: response.guardianPhone || response.phoneNumber || undefined,
      vaccineName: response.vaccineName || '',
      doseNumber: response.doseNumber || 1,
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      facilityId: response.facilityId || '',
      facilityName: response.facilityName || undefined,
      status: (response.status || 'SCHEDULED') as 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED' | 'RESCHEDULED',
      notes: response.notes || undefined,
      smsSent: response.smsSent || false,
      smsSentDate: response.smsSentDate || response.smsSentAt || undefined,
      createdAt: response.createdAt || new Date().toISOString()
    };
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<any>(`${this.apiUrl}/api/appointments/${id}`).pipe(
      map(response => this.mapBackendToFrontend(response))
    );
  }

  createAppointment(appointment: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<any>(`${this.apiUrl}/api/appointments`, appointment).pipe(
      map(response => this.mapBackendToFrontend(response))
    );
  }

  updateAppointment(id: string, appointment: UpdateAppointmentRequest | CreateAppointmentRequest): Observable<Appointment> {
    return this.http.put<any>(`${this.apiUrl}/api/appointments/${id}`, appointment).pipe(
      map(response => this.mapBackendToFrontend(response))
    );
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/appointments/${id}`);
  }

  getPatientAppointments(patientId: string): Observable<Appointment[]> {
    const params = new HttpParams().set('patientId', patientId);
    return this.http.get<any[]>(`${this.apiUrl}/api/appointments`, { params }).pipe(
      map((responses: any[]) => responses.map(response => this.mapBackendToFrontend(response)))
    );
  }
}

