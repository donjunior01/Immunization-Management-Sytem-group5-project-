import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// National Statistics Response Interface
export interface NationalStatistics {
  totalFacilities: number;
  totalVaccineTypes: number;
  totalDosesAvailable: number;
  totalPatientsRegistered: number;
  totalVaccinationsAdministered: number;
  activeCampaigns: number;
  lowStockAlerts: number;
  expiringBatches: number;
  coverageRate: number;
  facilitiesWithAlerts: number;
  recentActivities: NationalActivity[];
}

export interface NationalActivity {
  facilityId: string;
  facilityName: string;
  action: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

// Facility Statistics Response Interface
export interface FacilityStatistics {
  facilityId: string;
  facilityName: string;
  totalVaccineTypes: number;
  totalDosesAvailable: number;
  totalPatientsRegistered: number;
  totalVaccinationsAdministered: number;
  activeCampaigns: number;
  lowStockAlerts: number;
  expiringBatches: number;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Get national-level statistics (for government officials)
   * User Story: Government Dashboard with National Statistics
   */
  getNationalStatistics(): Observable<NationalStatistics> {
    return this.http.get<NationalStatistics>(`${this.apiUrl}/reports/national-stats`)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load national statistics'))
      );
  }

  /**
   * Get facility-specific statistics (for facility managers and health workers)
   * User Story: Facility Dashboard with Local Statistics
   */
  getFacilityStatistics(facilityId: string): Observable<FacilityStatistics> {
    return this.http.get<FacilityStatistics>(`${this.apiUrl}/reports/facility-stats/${facilityId}`)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load facility statistics'))
      );
  }

  /**
   * Get dashboard statistics by facility ID
   * This endpoint returns comprehensive dashboard data
   */
  getDashboardStats(facilityId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/dashboard/${facilityId}`)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load dashboard statistics'))
      );
  }

  /**
   * Get all facilities summary (for government officials)
   */
  getAllFacilitiesSummary(): Observable<FacilityStatistics[]> {
    return this.http.get<FacilityStatistics[]>(`${this.apiUrl}/reports/facilities-summary`)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load facilities summary'))
      );
  }

  /**
   * Get vaccination coverage report
   */
  getVaccinationCoverage(facilityId?: string): Observable<any> {
    const url = facilityId 
      ? `${this.apiUrl}/reports/coverage/${facilityId}`
      : `${this.apiUrl}/reports/coverage/national`;
    
    return this.http.get<any>(url)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load vaccination coverage'))
      );
  }

  /**
   * Get stock levels report
   */
  getStockReport(facilityId?: string): Observable<any> {
    const url = facilityId 
      ? `${this.apiUrl}/reports/stock/${facilityId}`
      : `${this.apiUrl}/reports/stock/national`;
    
    return this.http.get<any>(url)
      .pipe(
        catchError(error => this.handleError(error, 'Failed to load stock report'))
      );
  }

  /**
   * Error handler
   */
  private handleError(error: any, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please check your connection.';
    } else if (error.status === 403) {
      errorMessage = 'You do not have permission to access this data.';
    } else if (error.status === 404) {
      errorMessage = 'Data not found.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.error('Statistics Service Error:', error);
    return throwError(() => ({ message: errorMessage, error }));
  }

  /**
   * Generate mock national statistics (fallback when backend not ready)
   */
  getMockNationalStatistics(): NationalStatistics {
    return {
      totalFacilities: 15,
      totalVaccineTypes: 12,
      totalDosesAvailable: 285000,
      totalPatientsRegistered: 45230,
      totalVaccinationsAdministered: 189450,
      activeCampaigns: 8,
      lowStockAlerts: 5,
      expiringBatches: 3,
      coverageRate: 76.5,
      facilitiesWithAlerts: 3,
      recentActivities: [
        {
          facilityId: 'FAC001',
          facilityName: 'Central Health Center',
          action: 'Critical stock alert for BCG vaccine',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: 'warning'
        },
        {
          facilityId: 'FAC002',
          facilityName: 'Northern District Hospital',
          action: 'New batch of COVID-19 vaccines registered (5000 doses)',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          type: 'success'
        },
        {
          facilityId: 'FAC003',
          facilityName: 'Eastern Medical Center',
          action: 'Campaign "Polio Eradication Drive" completed successfully',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'success'
        },
        {
          facilityId: 'FAC001',
          facilityName: 'Central Health Center',
          action: 'Batch expiring in 15 days - immediate action required',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'error'
        },
        {
          facilityId: 'FAC004',
          facilityName: 'Southern Community Clinic',
          action: 'Monthly vaccination report submitted',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'info'
        }
      ]
    };
  }
}
