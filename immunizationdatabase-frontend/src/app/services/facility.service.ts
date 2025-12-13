import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Facility {
  id: string;
  name: string;
  type: string;
  districtId: string;
  county: string;
  address: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacilityService {
  private apiUrl = `${environment.apiUrl}/api/facilities`;

  constructor(private http: HttpClient) {}

  /**
   * Get all facilities
   */
  getAllFacilities(activeOnly: boolean = true): Observable<Facility[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<Facility[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get facility by ID
   */
  getFacilityById(id: string): Observable<Facility> {
    return this.http.get<Facility>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get facilities by district
   */
  getFacilitiesByDistrict(districtId: string): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.apiUrl}/district/${districtId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get facilities by county
   */
  getFacilitiesByCounty(county: string): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.apiUrl}/county/${county}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get facilities by type
   */
  getFacilitiesByType(type: string): Observable<Facility[]> {
    return this.http.get<Facility[]>(`${this.apiUrl}/type/${type}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get count of active facilities
   */
  getActiveFacilitiesCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stats/count`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Error handler
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }

    console.error('Facility Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
