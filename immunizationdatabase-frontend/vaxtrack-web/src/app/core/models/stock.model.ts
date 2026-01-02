export interface VaccineBatch {
  id: string;
  vaccineId: string;
  vaccineName?: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  receivedDate: string;
  receivedFrom?: string;
  facilityId: string;
  isDepleted: boolean;
}

export interface StockLevel {
  vaccineId: string;
  vaccineName: string;
  vaccineCode?: string;
  totalQuantity?: number;
  currentQuantity?: number; // New field from API
  batches?: VaccineBatch[];
  oldestExpiryDate?: string;
  status: 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT';
}

export interface StockMovement {
  id: string;
  vaccineId: string;
  vaccineName?: string;
  batchNumber: string;
  movementType: 'RECEIVED' | 'USED' | 'ADJUSTED' | 'DAMAGED' | 'EXPIRED';
  quantity: number;
  reason?: string;
  facilityId: string;
  createdBy: string;
  createdAt: string;
}

export interface ReceiveStockRequest {
  vaccineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  receivedDate: string;
  receivedFrom?: string;
}

export interface AdjustStockRequest {
  vaccineId: string;
  batchNumber: string;
  quantityChange: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'CORRECTION';
  notes?: string;
}



