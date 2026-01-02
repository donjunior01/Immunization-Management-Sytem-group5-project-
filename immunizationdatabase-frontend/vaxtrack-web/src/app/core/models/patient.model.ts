export interface Patient {
  id: string;
  patientId?: string; // Some backends use patientId as separate field
  fullName: string; // Backend uses fullName
  firstName?: string; // Computed from fullName
  lastName?: string; // Computed from fullName
  dateOfBirth?: string; // Backend field name
  birthDate?: string; // Alias for dateOfBirth
  gender: 'MALE' | 'FEMALE' | string;
  guardianName: string;
  phoneNumber?: string; // Backend field name
  guardianPhone?: string; // Alias for phoneNumber
  nationalId?: string;
  village?: string;
  address?: string;
  facilityId?: string;
  age?: number; // Computed age
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePatientRequest {
  fullName?: string; // Backend accepts fullName or firstName+lastName
  firstName?: string; // For frontend forms, will be combined to fullName
  lastName?: string; // For frontend forms, will be combined to fullName
  dateOfBirth: string; // Backend expects dateOfBirth
  birthDate?: string; // Alias for dateOfBirth
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  guardianName: string;
  phoneNumber?: string; // Backend expects phoneNumber
  guardianPhone?: string; // Alias for phoneNumber
  nationalId?: string;
  village?: string;
  address?: string;
  facilityId?: string; // Backend requires facilityId
}

export interface PatientSearchResponse {
  patients: Patient[];
  total: number;
}

import { VaccinationRecord } from './vaccination.model';
import { Appointment } from './appointment.model';

export interface PatientDetail extends Patient {
  age: number;
  vaccinationHistory: VaccinationRecord[];
  upcomingAppointments: Appointment[];
}

