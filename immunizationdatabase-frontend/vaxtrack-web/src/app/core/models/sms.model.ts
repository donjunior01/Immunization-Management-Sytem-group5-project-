export interface SmsLog {
  id: string;
  recipientPhone: string;
  message: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sentAt?: string;
  errorMessage?: string;
  appointmentId?: string;
  patientId?: string;
}

export interface SmsLogFilter {
  startDate?: string;
  endDate?: string;
  status?: 'SENT' | 'FAILED' | 'PENDING';
  recipientPhone?: string;
}

