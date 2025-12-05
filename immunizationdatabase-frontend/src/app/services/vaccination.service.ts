import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Vaccination, RecordVaccinationRequest } from '../models/vaccination.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VaccinationService {
  private apiUrl = `${environment.apiUrl}/vaccinations`;

  constructor(private http: HttpClient) { }

  recordVaccination(request: RecordVaccinationRequest): Observable<Vaccination> {
    return this.http.post<Vaccination>(this.apiUrl, request);
  }

  getVaccinationHistory(patientId: string): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getVaccinationsByFacility(facilityId: string): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${this.apiUrl}/facility/${facilityId}`);
  }

  getVaccinationsByDateRange(facilityId: string, startDate: string, endDate: string): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${this.apiUrl}/facility/${facilityId}/date-range`, {
      params: { startDate, endDate }
    });
  }
}
