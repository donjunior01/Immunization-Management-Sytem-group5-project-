import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';

export interface VaccineBatch {
  id?: number;
  vaccine_name: string;
  batch_number: string;
  manufacturer: string;
  quantity: number;
  expiry_date: string;
  storage_location?: string;
  temperature?: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BatchCreateRequest {
  vaccine_name: string;
  batch_number: string;
  manufacturer: string;
  quantity: number;
  expiry_date: string;
  storage_location?: string;
  temperature?: number;
  notes?: string;
}

export interface BatchUpdateRequest {
  quantity?: number;
  storage_location?: string;
  temperature?: number;
  notes?: string;
}

export interface DashboardStats {
  totalVaccineTypes: number;
  totalDoses: number;
  lowStockItems: number;
  expiringSoon: number;
}

/**
 * Inventory Service with Mock Data Support
 * Set USE_MOCK_DATA to true for demo mode
 * Set USE_MOCK_DATA to false for production API calls
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiUrl}/api/batches`;

  // TOGGLE THIS FOR DEMO MODE
  private readonly USE_MOCK_DATA = true; // Set to false when backend is ready

  constructor(
    private http: HttpClient,
    private mockDataService: MockDataService
  ) {
    if (this.USE_MOCK_DATA) {
      console.log('🎭 DEMO MODE: Using mock data for inventory');
    }
  }

  /**
   * Get all vaccine batches
   */
  getAllBatches(): Observable<VaccineBatch[]> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getAllBatches();
    }

    return this.http.get<VaccineBatch[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get batch by ID
   */
  getBatchById(id: number): Observable<VaccineBatch> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getBatchById(id);
    }

    return this.http.get<VaccineBatch>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Register a new vaccine batch
   */
  createBatch(batch: BatchCreateRequest): Observable<VaccineBatch> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.createBatch(batch);
    }

    return this.http.post<VaccineBatch>(this.apiUrl, batch)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing batch
   */
  updateBatch(id: number, updates: BatchUpdateRequest): Observable<VaccineBatch> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.updateBatch(id, updates);
    }

    return this.http.put<VaccineBatch>(`${this.apiUrl}/${id}`, updates)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a batch
   */
  deleteBatch(id: number): Observable<void> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.deleteBatch(id);
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get batches filtered by vaccine name
   */
  getBatchesByVaccine(vaccineName: string): Observable<VaccineBatch[]> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getBatchesByVaccine(vaccineName);
    }

    const params = new HttpParams().set('vaccine_name', vaccineName);
    return this.http.get<VaccineBatch[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get batches expiring within specified days
   */
  getExpiringBatches(days: number = 30): Observable<VaccineBatch[]> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getExpiringBatches(days);
    }

    const params = new HttpParams().set('days', days.toString());
    return this.http.get<VaccineBatch[]>(`${this.apiUrl}/expiring`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get low stock items
   */
  getLowStockBatches(threshold: number = 1000): Observable<VaccineBatch[]> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getLowStockBatches(threshold);
    }

    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<VaccineBatch[]>(`${this.apiUrl}/low-stock`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    if (this.USE_MOCK_DATA) {
      return this.mockDataService.getDashboardStats();
    }

    return this.getAllBatches().pipe(
      map(batches => {
        const vaccineTypes = new Set(batches.map(b => b.vaccine_name));
        const totalDoses = batches.reduce((sum, b) => sum + b.quantity, 0);

        const vaccineQuantities = new Map<string, number>();
        batches.forEach(b => {
          const current = vaccineQuantities.get(b.vaccine_name) || 0;
          vaccineQuantities.set(b.vaccine_name, current + b.quantity);
        });
        const lowStockItems = Array.from(vaccineQuantities.values())
          .filter(qty => qty < 1000).length;

        const now = new Date();
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringSoon = batches.filter(b => {
          const expiryDate = new Date(b.expiry_date);
          return expiryDate <= thirtyDaysLater;
        }).length;

        return {
          totalVaccineTypes: vaccineTypes.size,
          totalDoses,
          lowStockItems,
          expiringSoon
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Validate batch number uniqueness
   */
  validateBatchNumber(batchNumber: string): Observable<boolean> {
    return this.getAllBatches().pipe(
      map(batches => {
        return !batches.some(b => b.batch_number === batchNumber);
      }),
      catchError(() => {
        return [true];
      })
    );
  }

  /**
   * Get unique vaccine names for autocomplete
   */
  getVaccineNames(): Observable<string[]> {
    return this.getAllBatches().pipe(
      map(batches => {
        const names = new Set(batches.map(b => b.vaccine_name));
        return Array.from(names).sort();
      }),
      catchError(() => {
        return [this.getCommonVaccineNames()];
      })
    );
  }

  /**
   * Get unique manufacturers for autocomplete
   */
  getManufacturers(): Observable<string[]> {
    return this.getAllBatches().pipe(
      map(batches => {
        const manufacturers = new Set(batches.map(b => b.manufacturer));
        return Array.from(manufacturers).sort();
      }),
      catchError(() => {
        return [this.getCommonManufacturers()];
      })
    );
  }

  /**
   * Helper: Common vaccine names
   */
  getCommonVaccineNames(): string[] {
    return [
      'COVID-19 (Pfizer-BioNTech)',
      'COVID-19 (Moderna)',
      'COVID-19 (AstraZeneca)',
      'Measles-Mumps-Rubella (MMR)',
      'Hepatitis B',
      'Hepatitis A',
      'Tetanus-Diphtheria (Td)',
      'Tetanus-Diphtheria-Pertussis (Tdap)',
      'Polio (IPV)',
      'BCG (Tuberculosis)',
      'Yellow Fever',
      'Influenza',
      'Pneumococcal',
      'Meningococcal',
      'Human Papillomavirus (HPV)',
      'Rotavirus',
      'Varicella (Chickenpox)'
    ];
  }

  /**
   * Helper: Common manufacturers
   */
  getCommonManufacturers(): string[] {
    return [
      'Pfizer',
      'Moderna',
      'AstraZeneca',
      'Johnson & Johnson',
      'GSK (GlaxoSmithKline)',
      'Sanofi Pasteur',
      'Merck',
      'Novartis',
      'Serum Institute of India',
      'Sinovac',
      'Sinopharm',
      'AJ Vaccines',
      'Bharat Biotech'
    ];
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

    console.error('Inventory Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Toggle between mock and real API (for testing)
   */
  isMockMode(): boolean {
    return this.USE_MOCK_DATA;
  }

  /**
   * Reset mock data (for demos)
   */
  resetMockData(): void {
    if (this.USE_MOCK_DATA) {
      this.mockDataService.resetMockData();
    }
  }
}