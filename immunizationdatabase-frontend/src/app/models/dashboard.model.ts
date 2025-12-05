export interface DashboardStats {
  totalPatients: number;
  totalVaccinations?: number;
  vaccinationsThisMonth: number;
  activeCampaigns: number;
  availableBatches: number;
  expiringBatches: number;
  coverageRate: number;
  pendingSyncItems: number;
}
