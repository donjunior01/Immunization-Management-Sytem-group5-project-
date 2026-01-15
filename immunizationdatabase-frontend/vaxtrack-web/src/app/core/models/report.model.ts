export interface CoverageReport {
  facilityId?: string;
  facilityName?: string;
  startDate: string;
  endDate: string;
  totalPatientsRegistered: number;
  vaccinationsByVaccine: VaccinationCount[];
  penta1Count: number;
  penta3Count: number;
  pentaDropoutRate: number;
  coveragePercentage: number;
  targetPopulation?: number;
}

export interface VaccinationCount {
  vaccineId: string;
  vaccineName: string;
  totalDoses: number;
  doseBreakdown: { [doseNumber: number]: number };
}

export interface MonthlySummary {
  month: string;
  totalVaccinations: number;
  patientsRegistered: number;
  stockConsumption: { [vaccineId: string]: number };
  appointmentAdherenceRate: number;
  totalAppointments: number;
  completedAppointments: number;
}

export interface Facility {
  id: string;
  name: string;
  district: string;
  region?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}









