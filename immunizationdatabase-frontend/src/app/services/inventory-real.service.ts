import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VaccineBatchResponse {
  id: number;
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  quantityReceived: number;
  quantityRemaining: number;
  expiryDate: string;
  receiptDate: string;
  facilityId: string;
  createdAt: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
}

export interface CreateVaccineBatchRequest {
  batchNumber: string;
  vaccineName: string;
  manufacturer: string;
  quantityReceived: number;
  expiryDate: string;
  receiptDate: string;
  facilityId: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryRealService {
  private apiUrl = `${environment.apiUrl}/inventory`;

  constructor(private http: HttpClient) { }

  createBatch(request: CreateVaccineBatchRequest): Observable<VaccineBatchResponse> {
    return this.http.post<VaccineBatchResponse>(`${this.apiUrl}/batches`, request);
  }

  getBatches(facilityId?: string): Observable<VaccineBatchResponse[]> {
    // If no facilityId provided, use a default or fetch all batches
    if (facilityId) {
      return this.getBatchesByFacility(facilityId);
    }
    // Fetch all batches across facilities (you may need to add this endpoint in backend)
    return this.http.get<VaccineBatchResponse[]>(`${this.apiUrl}/batches`);
  }

  getBatchesByFacility(facilityId: string): Observable<VaccineBatchResponse[]> {
    return this.http.get<VaccineBatchResponse[]>(`${this.apiUrl}/batches/facility/${facilityId}`);
  }

  getAvailableBatches(facilityId: string): Observable<VaccineBatchResponse[]> {
    return this.http.get<VaccineBatchResponse[]>(`${this.apiUrl}/batches/available/${facilityId}`);
  }

  getExpiringSoonBatches(facilityId: string): Observable<VaccineBatchResponse[]> {
    return this.http.get<VaccineBatchResponse[]>(`${this.apiUrl}/batches/expiring-soon/${facilityId}`);
  }

  getBatchById(batchId: number): Observable<VaccineBatchResponse> {
    return this.http.get<VaccineBatchResponse>(`${this.apiUrl}/batches/${batchId}`);
  }

  updateBatch(batchId: number, request: CreateVaccineBatchRequest): Observable<VaccineBatchResponse> {
    return this.http.put<VaccineBatchResponse>(`${this.apiUrl}/batches/${batchId}`, request);
  }

  deleteBatch(batchId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/batches/${batchId}`);
  }
}
