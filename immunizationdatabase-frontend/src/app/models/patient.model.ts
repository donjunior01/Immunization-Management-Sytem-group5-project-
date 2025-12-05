export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  phoneNumber?: string;
  address?: string;
  facilityId: string;
  createdAt: string;
  age: number;
}

export interface CreatePatientRequest {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  phoneNumber?: string;
  address?: string;
  facilityId: string;
}
