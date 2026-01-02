import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StockLevel, StockMovement, ReceiveStockRequest, AdjustStockRequest, VaccineBatch } from '../models/stock.model';
import { environment } from '../../../environments/environment';

interface BatchResponse {
  id?: number | string;
  vaccineId?: string | number;
  vaccine_id?: string | number;
  vaccineName?: string;
  vaccine_name?: string;
  batchNumber?: string;
  batch_number?: string;
  quantityRemaining?: number;
  quantity_remaining?: number;
  expiryDate?: string;
  expiry_date?: string;
  facilityId?: string;
  facility_id?: string;
  isDepleted?: boolean;
  is_depleted?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStockLevels(facilityId?: string): Observable<StockLevel[]> {
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facility_id', facilityId);
    }
    // Use the new stock endpoint - /api/v1/stock (context path /api + /v1/stock)
    return this.http.get<StockLevel[]>(`${this.apiUrl}/api/v1/stock`, { params }).pipe(
      map((stockLevels: StockLevel[]) => {
        // Map the response to match the StockLevel interface
        return stockLevels.map((stock: any) => ({
          vaccineId: stock.vaccineId || '',
          vaccineName: stock.vaccineName || '',
          vaccineCode: stock.vaccineId || '',
          currentQuantity: stock.currentQuantity || 0,
          totalQuantity: stock.currentQuantity || 0, // For backward compatibility
          oldestExpiryDate: stock.oldestExpiryDate || '',
          status: stock.status || 'GOOD',
          batches: [] // Not included in this endpoint
        }));
      })
    );
  }

  receiveStock(receipt: ReceiveStockRequest): Observable<any> {
    // Use the new endpoint: /api/v1/stock/receive
    return this.http.post<any>(`${this.apiUrl}/api/v1/stock/receive`, receipt);
  }

  adjustStock(adjustment: AdjustStockRequest): Observable<any> {
    // Use the new endpoint: /api/v1/stock/adjust
    return this.http.post<any>(`${this.apiUrl}/api/v1/stock/adjust`, adjustment);
  }

  getStockMovements(facilityId?: string, startDate?: string, endDate?: string): Observable<StockMovement[]> {
    let params = new HttpParams();
    if (facilityId) params = params.set('facility_id', facilityId);
    if (startDate) params = params.set('start_date', startDate);
    if (endDate) params = params.set('end_date', endDate);
    return this.http.get<StockMovement[]>(`${this.apiUrl}/api/inventory/stock/movements`, { params });
  }

  getBatchesByVaccine(vaccineId: string, facilityId?: string): Observable<VaccineBatch[]> {
    // Get vaccine name from the vaccine ID (assuming vaccine ID is the name or code)
    // If facilityId is provided, use the specific endpoint, otherwise use the batches endpoint with filter
    if (facilityId) {
      // URL-encode the vaccine name to handle spaces and special characters (e.g., "Hepatitis B" -> "Hepatitis%20B")
      const encodedVaccineName = encodeURIComponent(vaccineId);
      console.log('Loading batches for vaccine:', vaccineId, 'encoded:', encodedVaccineName, 'facilityId:', facilityId);
      // Use the new endpoint for getting batches by vaccine name and facility
      return this.http.get<BatchResponse[]>(`${this.apiUrl}/api/inventory/batches/available/${facilityId}/vaccine/${encodedVaccineName}`).pipe(
        map((batches: BatchResponse[]) => {
          console.log(`Received ${batches.length} batches from backend for vaccine: ${vaccineId}`);
          return batches.map(b => ({
            id: String(b.id || ''),
            vaccineId: String(b.vaccineId || b.vaccine_id || vaccineId),
            vaccineName: b.vaccineName || b.vaccine_name || '',
            batchNumber: b.batchNumber || b.batch_number || '',
            quantity: b.quantityRemaining || b.quantity_remaining || 0,
            expiryDate: b.expiryDate || b.expiry_date || '',
            receivedDate: b.expiryDate || b.expiry_date || '',
            facilityId: String(b.facilityId || b.facility_id || facilityId),
            isDepleted: b.isDepleted || b.is_depleted || false
          }));
        })
      );
    } else {
      // Fallback to batches endpoint with vaccine_name filter
      let params = new HttpParams().set('vaccine_name', vaccineId);
      return this.http.get<BatchResponse[]>(`${this.apiUrl}/api/inventory/batches`, { params }).pipe(
        map((batches: BatchResponse[]) => batches.map(b => ({
          id: String(b.id || ''),
          vaccineId: String(b.vaccineId || b.vaccine_id || vaccineId),
          vaccineName: b.vaccineName || b.vaccine_name || '',
          batchNumber: b.batchNumber || b.batch_number || '',
          quantity: b.quantityRemaining || b.quantity_remaining || 0,
          expiryDate: b.expiryDate || b.expiry_date || '',
          receivedDate: b.expiryDate || b.expiry_date || '',
          facilityId: String(b.facilityId || b.facility_id || ''),
          isDepleted: b.isDepleted || b.is_depleted || false
        })))
      );
    }
  }

  getExpiringBatches(facilityId?: string, days: number = 30): Observable<VaccineBatch[]> {
    let params = new HttpParams().set('days', days.toString());
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    return this.http.get<BatchResponse[]>(`${this.apiUrl}/api/inventory/batches/expiring`, { params }).pipe(
      map((batches: BatchResponse[]) => batches.map(b => ({
        id: String(b.id || ''),
        vaccineId: String(b.vaccineId || b.vaccine_id || ''),
        vaccineName: b.vaccineName || b.vaccine_name || '',
        batchNumber: b.batchNumber || b.batch_number || '',
        quantity: b.quantityRemaining || b.quantity_remaining || 0,
        expiryDate: b.expiryDate || b.expiry_date || '',
        receivedDate: b.expiryDate || b.expiry_date || '',
        facilityId: String(b.facilityId || b.facility_id || ''),
        isDepleted: b.isDepleted || b.is_depleted || false
      })))
    );
  }
}

