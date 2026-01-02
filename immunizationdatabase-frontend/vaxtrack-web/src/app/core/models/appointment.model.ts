export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  patientAge?: number; // Age in months
  guardianName?: string; // For display in appointment lists
  guardianPhone?: string; // For display in appointment lists
  vaccineName: string;
  doseNumber: number;
  appointmentDate: string;
  appointmentTime?: string;
  facilityId: string;
  facilityName?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  smsSent: boolean;
  smsSentDate?: string;
  createdAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  facilityId: string;
  vaccineName: string;
  doseNumber: number;
  appointmentDate: string;
  appointmentTime?: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  status?: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  notes?: string;
}

