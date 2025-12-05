import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VaccinationResponse {
  id: number;
  patientId: string;
  patientName?: string;
  batchId: number;
  batchNumber?: string;
  nurseId: number;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  vaccinationDate?: string; // Alias for dateAdministered
  administeredBy?: string;
  facilityId: string;
  facilityName?: string;
  notes?: string;
  createdAt: string;
}

export interface RecordVaccinationRequest {
  patientId: string;
  batchId: number;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  administeredBy?: string;
  facilityId: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VaccinationRealService {
  private apiUrl = `${environment.apiUrl}/vaccinations`;

  constructor(private http: HttpClient) { }

  recordVaccination(request: RecordVaccinationRequest): Observable<VaccinationResponse> {
    return this.http.post<VaccinationResponse>(this.apiUrl, request);
  }

  getVaccinationHistory(patientId: string): Observable<VaccinationResponse[]> {
    return this.http.get<VaccinationResponse[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getPatientVaccinations(patientId: string): Observable<VaccinationResponse[]> {
    return this.getVaccinationHistory(patientId);
  }

  getVaccinationsByFacility(facilityId: string): Observable<VaccinationResponse[]> {
    return this.http.get<VaccinationResponse[]>(`${this.apiUrl}/facility/${facilityId}`);
  }

  getVaccinationsByDateRange(facilityId: string, startDate: string, endDate: string): Observable<VaccinationResponse[]> {
    return this.http.get<VaccinationResponse[]>(`${this.apiUrl}/facility/${facilityId}/date-range`, {
      params: { startDate, endDate }
    });
  }
}
