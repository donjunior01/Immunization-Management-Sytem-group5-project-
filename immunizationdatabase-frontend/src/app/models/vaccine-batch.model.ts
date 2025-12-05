export interface VaccineBatch {
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
