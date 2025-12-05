import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, CreatePatientRequest } from '../models/patient.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) { }

  createPatient(request: CreatePatientRequest): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, request);
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${id}`);
  }

  getPatient(id: string): Observable<Patient> {
    return this.getPatientById(id);
  }

  getPatientsByFacility(facilityId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/facility/${facilityId}`);
  }

  searchPatients(facilityId: string, searchTerm: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/search`, {
      params: { facilityId, searchTerm }
    });
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
