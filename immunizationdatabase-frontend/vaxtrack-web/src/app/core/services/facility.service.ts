import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Facility {
  id: string;
  name: string;
  type?: string;
  district?: string;
  county?: string;
  location?: string;
  active?: boolean;
  userCount?: number;
  patientCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacilityService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllFacilities(activeOnly: boolean = true): Observable<Facility[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<Facility[]>(`${this.apiUrl}/api/facilities`, { params });
  }

  getFacilityById(id: string): Observable<Facility> {
    return this.http.get<Facility>(`${this.apiUrl}/api/facilities/${id}`);
  }

  getFacilitiesByDistrict(districtId: string): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.apiUrl}/api/facilities/district/${districtId}`);
  }

  createFacility(facility: Partial<Facility>): Observable<Facility> {
    return this.http.post<Facility>(`${this.apiUrl}/api/facilities`, facility);
  }

  updateFacility(id: string, facility: Partial<Facility>): Observable<Facility> {
    return this.http.put<Facility>(`${this.apiUrl}/api/facilities/${id}`, facility);
  }

  deleteFacility(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/facilities/${id}`);
  }
}

