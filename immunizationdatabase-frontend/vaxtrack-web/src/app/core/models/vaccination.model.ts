export interface Vaccine {
  id: string;
  name: string;
  code: string;
  description?: string;
  maxDoses: number;
  isActive: boolean;
}

export interface VaccinationRecord {
  id: string;
  patientId: string;
  patientName?: string;
  vaccineId: string;
  vaccineName?: string;
  doseNumber: number;
  batchNumber: string;
  administeredDate: string;
  date?: string; // Alias for administeredDate for template compatibility
  administeredBy: string;
  administeredByName?: string;
  administrationSite: 'LEFT_ARM' | 'RIGHT_ARM' | 'LEFT_THIGH' | 'RIGHT_THIGH' | 'ORAL';
  site?: string; // Alias for administrationSite for template compatibility
  expiryDate?: string; // Batch expiry date
  notes?: string; // General notes
  adverseEventNotes?: string;
  facilityId: string;
  facilityName?: string;
  nextAppointmentId?: string;
  nextAppointmentDate?: string;
}

export interface CreateVaccinationRequest {
  patientId: string;
  vaccineId: string;
  doseNumber: number;
  batchNumber: string;
  administeredDate: string;
  administrationSite: 'LEFT_ARM' | 'RIGHT_ARM' | 'LEFT_THIGH' | 'RIGHT_THIGH' | 'ORAL';
  adverseEventNotes?: string;
}

export interface AdverseEvent {
  id: string;
  patientId: string;
  patientName?: string;
  vaccinationId?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  description: string;
  actionTaken?: string;
  reportedBy?: string;
  reportedByName?: string;
  reportedAt: string;
  createdAt: string;
}

export interface CreateAdverseEventRequest {
  patientId: string;
  vaccinationId?: number;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  description: string;
  actionTaken?: string;
}

