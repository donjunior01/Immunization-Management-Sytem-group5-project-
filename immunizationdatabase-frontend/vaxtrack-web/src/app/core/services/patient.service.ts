import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Patient, CreatePatientRequest, PatientSearchResponse, PatientDetail } from '../models/patient.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createPatient(patient: CreatePatientRequest): Observable<Patient> {
    // Map frontend request to backend format
    const backendRequest: any = {
      fullName: patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      dateOfBirth: patient.dateOfBirth || patient.birthDate,
      gender: patient.gender,
      guardianName: patient.guardianName,
      phoneNumber: patient.phoneNumber || patient.guardianPhone,
      address: patient.address || patient.village || ''
    };
    
    // Add facilityId if provided, otherwise backend will use user's facility
    if (patient.facilityId) {
      backendRequest.facilityId = patient.facilityId;
    }
    
    return this.http.post<any>(`${this.apiUrl}/api/patients`, backendRequest).pipe(
      map(response => this.mapBackendToFrontend(response))
    );
  }

  searchPatients(query: string, facilityId?: string): Observable<PatientSearchResponse> {
    let params = new HttpParams();
    // Use new format: ?q={query} (backend supports both formats)
    if (query && query.trim()) {
      params = params.set('q', query.trim());
    }
    // Include facilityId if provided (for facility-scoped search)
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/patients/search`, { params }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return {
            patients: response.map(p => this.mapBackendToFrontend(p)),
            total: response.length
          };
        }
        const searchResponse = response as any;
        return {
          patients: (searchResponse.patients || []).map((p: any) => this.mapBackendToFrontend(p)),
          total: searchResponse.total || 0
        };
      })
    );
  }

  getPatientById(id: string): Observable<PatientDetail> {
    return this.http.get<any>(`${this.apiUrl}/api/patients/${id}`).pipe(
      map(response => {
        const patient = this.mapBackendToFrontend(response);
        return {
          ...patient,
          age: response.age || this.calculateAge(response.dateOfBirth || response.birthDate),
          vaccinationHistory: response.vaccinationHistory || [],
          upcomingAppointments: response.upcomingAppointments || []
        } as PatientDetail;
      })
    );
  }

  private mapBackendToFrontend(backendPatient: any): Patient {
    const fullName = backendPatient.fullName || '';
    const nameParts = fullName.split(' ').filter((p: string) => p.length > 0);
    
    // Ensure we have an ID - use id, patientId, or generate one
    const patientId = String(backendPatient.id || backendPatient.patientId || '');
    
    return {
      id: patientId,
      patientId: backendPatient.patientId || patientId, // Keep both for compatibility
      fullName: fullName,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      dateOfBirth: backendPatient.dateOfBirth,
      birthDate: backendPatient.dateOfBirth || backendPatient.birthDate,
      gender: backendPatient.gender || 'MALE',
      guardianName: backendPatient.guardianName || '',
      phoneNumber: backendPatient.phoneNumber,
      guardianPhone: backendPatient.phoneNumber || backendPatient.guardianPhone,
      village: backendPatient.village || backendPatient.address || '',
      address: backendPatient.address || backendPatient.village || '',
      facilityId: backendPatient.facilityId,
      age: backendPatient.age || this.calculateAge(backendPatient.dateOfBirth || backendPatient.birthDate),
      createdAt: backendPatient.createdAt || new Date().toISOString()
    };
  }

  private calculateAge(birthDate?: string): number {
    if (!birthDate) return 0;
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 0;
    }
  }

  getPatientVaccinations(patientId: string): Observable<any[]> {
    // Try new endpoint first, fallback to old endpoint
    return this.http.get<any[]>(`${this.apiUrl}/api/patients/${patientId}/vaccinations`).pipe(
      // If new endpoint fails, try old endpoint
      // catchError(() => this.http.get<any[]>(`${this.apiUrl}/api/vaccinations/patient/${patientId}`))
    );
  }

  updatePatient(id: string, patient: Partial<CreatePatientRequest>): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/api/patients/${id}`, patient);
  }

  getPatientsByFacility(facilityId: string): Observable<Patient[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/patients/facility/${facilityId}`).pipe(
      map(response => response.map(p => this.mapBackendToFrontend(p)))
    );
  }

  getPatientsCountByFacility(facilityId: string, startDate?: string, endDate?: string): Observable<number> {
    return this.getPatientsByFacility(facilityId).pipe(
      map(patients => {
        if (!startDate && !endDate) return patients.length;
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        return patients.filter(p => {
          const created = new Date(p.createdAt || 0);
          return created >= start && created <= end;
        }).length;
      })
    );
  }
}

