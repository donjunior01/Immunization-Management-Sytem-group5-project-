export interface Campaign {
  id: number;
  name: string;
  description?: string;
  vaccineName: string;
  targetAgeGroup?: string;
  startDate: string;
  endDate: string;
  targetPopulation?: number;
  vaccinatedCount: number;
  status: CampaignStatus;
  facilityId?: string;
  districtId?: string;
  nationalId?: string;
  createdAt: string;
  coveragePercentage: number;
}

export enum CampaignStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  vaccineName: string;
  targetAgeGroup?: string;
  startDate: string;
  endDate: string;
  targetPopulation?: number;
  facilityId?: string;
  districtId?: string;
  nationalId?: string;
}
