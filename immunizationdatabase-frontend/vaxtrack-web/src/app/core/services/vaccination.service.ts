import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vaccine, VaccinationRecord, CreateVaccinationRequest, AdverseEvent } from '../models/vaccination.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VaccinationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllVaccines(): Observable<Vaccine[]> {
    return this.http.get<Vaccine[]>(`${this.apiUrl}/api/inventory/vaccines`);
  }

  recordVaccination(vaccination: CreateVaccinationRequest): Observable<VaccinationRecord> {
    return this.http.post<any>(`${this.apiUrl}/api/vaccinations`, vaccination).pipe(
      map((response: any) => ({
        id: String(response.id || ''),
        patientId: String(response.patientId || ''),
        patientName: response.patientName || '',
        vaccineId: '',
        vaccineName: response.vaccineName || '',
        doseNumber: response.doseNumber || 1,
        batchNumber: response.batchNumber || '',
        administeredDate: response.dateAdministered || response.administeredDate || '',
        date: response.dateAdministered || response.administeredDate || '',
        administeredBy: response.nurseName || '',
        administeredByName: response.nurseName || '',
        administrationSite: (response.administrationSite || 'LEFT_ARM') as any,
        site: response.administrationSite || 'LEFT_ARM',
        notes: response.notes || '',
        facilityId: response.facilityId || '',
        facilityName: '',
        nextAppointmentId: response.nextAppointmentId ? String(response.nextAppointmentId) : undefined,
        nextAppointmentDate: response.nextAppointmentDate || undefined
      }))
    );
  }

  getVaccinationById(id: string): Observable<VaccinationRecord> {
    return this.http.get<VaccinationRecord>(`${this.apiUrl}/api/vaccinations/${id}`);
  }

  reportAdverseEvent(adverseEvent: Partial<AdverseEvent>): Observable<AdverseEvent> {
    return this.http.post<AdverseEvent>(`${this.apiUrl}/api/adverse-events`, adverseEvent);
  }

  getPatientVaccinations(patientId: string): Observable<VaccinationRecord[]> {
    return this.http.get<VaccinationRecord[]>(`${this.apiUrl}/api/patients/${patientId}/vaccinations`);
  }

  getVaccinationsByFacility(facilityId: string): Observable<VaccinationRecord[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/vaccinations/facility/${facilityId}`).pipe(
      map((vaccinations: any[]) => vaccinations.map(v => ({
        id: String(v.id || ''),
        patientId: String(v.patientId || ''),
        patientName: v.patientName || '',
        vaccineId: '', // Not in response, but not critical
        vaccineName: v.vaccineName || '',
        doseNumber: v.doseNumber || 1,
        batchNumber: v.batchNumber || '',
        administeredDate: v.dateAdministered || v.administeredDate || '',
        date: v.dateAdministered || v.administeredDate || '',
        administeredBy: v.nurseName || v.administeredBy || '',
        administeredByName: v.nurseName || v.administeredByName || '',
        administrationSite: 'LEFT_ARM' as const, // Default, not in response
        site: 'LEFT_ARM',
        notes: v.notes || '',
        facilityId: v.facilityId || '',
        facilityName: ''
      })))
    );
  }

  getVaccinationsByDateRange(facilityId: string, startDate: string, endDate: string): Observable<VaccinationRecord[]> {
    return this.http.get<VaccinationRecord[]>(`${this.apiUrl}/api/vaccinations/facility/${facilityId}`, {
      params: { startDate, endDate }
    });
  }
}

