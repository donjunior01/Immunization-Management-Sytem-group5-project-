import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdverseEvent, CreateAdverseEventRequest } from '../models/vaccination.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdverseEventService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createAdverseEvent(request: CreateAdverseEventRequest): Observable<AdverseEvent> {
    return this.http.post<AdverseEvent>(`${this.apiUrl}/api/v1/adverse-events`, request);
  }

  getPatientAdverseEvents(patientId: string): Observable<AdverseEvent[]> {
    return this.http.get<AdverseEvent[]>(`${this.apiUrl}/api/v1/adverse-events/patient/${patientId}`);
  }

  getVaccinationAdverseEvents(vaccinationId: string): Observable<AdverseEvent[]> {
    return this.http.get<AdverseEvent[]>(`${this.apiUrl}/api/v1/adverse-events/vaccination/${vaccinationId}`);
  }
}

