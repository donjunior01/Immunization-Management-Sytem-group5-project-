export interface Vaccination {
  id: number;
  patientId: string;
  patientName?: string;
  batchId: number;
  batchNumber?: string;
  nurseId: number;
  nurseName?: string;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  facilityId: string;
  notes?: string;
  createdAt: string;
}

export interface RecordVaccinationRequest {
  patientId: string;
  batchId: number;
  vaccineName: string;
  doseNumber: number;
  dateAdministered: string;
  facilityId: string;
  notes?: string;
}
