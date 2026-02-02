import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  vaccineName: string;
  targetAgeGroup?: string;
  startDate: string;
  endDate: string;
  targetPopulation?: number;
  vaccinatedCount?: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  facilityId?: string;
  districtId?: string;
  nationalId?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
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
  nationalId?: string; // Backend expects string
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  vaccineName?: string;
  targetAgeGroup?: string;
  startDate?: string;
  endDate?: string;
  targetPopulation?: number;
  facilityId?: string;
  districtId?: string;
  nationalId?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAllCampaigns(facilityId?: string): Observable<Campaign[]> {let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    const url = `${this.apiUrl}/api/campaigns`;return this.http.get<any[]>(url, { params }).pipe(// Map backend response to frontend Campaign interface
      map((response: any[]): Campaign[] => {
        return response.map((campaign: any): Campaign => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          vaccineName: campaign.vaccineName,
          targetAgeGroup: campaign.targetAgeGroup,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          targetPopulation: campaign.targetPopulation,
          vaccinatedCount: campaign.vaccinatedCount,
          status: campaign.status,
          facilityId: campaign.facilityId,
          districtId: campaign.districtId,
          // Convert nationalId from string to boolean if needed
          nationalId: campaign.nationalId === 'true' || campaign.nationalId === true || !!campaign.nationalId,
          createdBy: campaign.createdBy,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt
        }));
      }),);
  }

  getActiveCampaigns(facilityId?: string): Observable<Campaign[]> {let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    const url = `${this.apiUrl}/api/campaigns/active`;return this.http.get<any[]>(url, { params }).pipe(// Map backend response to frontend Campaign interface
      map((response: any[]): Campaign[] => {
        return response.map((campaign: any): Campaign => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          vaccineName: campaign.vaccineName,
          targetAgeGroup: campaign.targetAgeGroup,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          targetPopulation: campaign.targetPopulation,
          vaccinatedCount: campaign.vaccinatedCount,
          status: campaign.status,
          facilityId: campaign.facilityId,
          districtId: campaign.districtId,
          // Convert nationalId from string to boolean if needed
          nationalId: campaign.nationalId === 'true' || campaign.nationalId === true || !!campaign.nationalId,
          createdBy: campaign.createdBy,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt
        }));
      }),);
  }

  getCampaignsByFacility(facilityId: string): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/facility/${facilityId}`);
  }

  getCampaignsByDistrict(districtId: string): Observable<Campaign[]> {
    // Get all facilities in district, then get campaigns for each
    // For now, we'll use active campaigns endpoint with district filter
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/active`);
  }

  createCampaign(campaign: CreateCampaignRequest): Observable<Campaign> {return this.http.post<any>(`${this.apiUrl}/api/campaigns`, campaign).pipe(// Map backend response to frontend Campaign interface
      map((response: any): Campaign => ({
        id: response.id,
        name: response.name,
        description: response.description,
        vaccineName: response.vaccineName,
        targetAgeGroup: response.targetAgeGroup,
        startDate: response.startDate,
        endDate: response.endDate,
        targetPopulation: response.targetPopulation,
        vaccinatedCount: response.vaccinatedCount,
        status: response.status,
        facilityId: response.facilityId,
        districtId: response.districtId,
        // Convert nationalId from string to boolean
        nationalId: response.nationalId === 'true' || response.nationalId === true || !!response.nationalId,
        createdBy: response.createdBy,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      }))
    );
  }

  updateCampaignStatus(campaignId: number, status: Campaign['status']): Observable<Campaign> {const params = new HttpParams().set('status', status);
    return this.http.patch<Campaign>(`${this.apiUrl}/api/campaigns/${campaignId}/status`, null, {
      params
    });
  }

  // Get all campaigns (active and inactive) by aggregating from all facilities in district
  getAllCampaignsForDistrict(districtId: string, facilities: string[]): Observable<Campaign[]> {
    // Get campaigns from all facilities in the district
    const campaignObservables = facilities.map(facilityId => 
      this.getCampaignsByFacility(facilityId)
    );
    
    // Combine all observables and merge results
    return new Observable(observer => {
      const allCampaigns: Campaign[] = [];
      let completed = 0;
      
      campaignObservables.forEach(obs => {
        obs.subscribe({
          next: (campaigns) => {
            allCampaigns.push(...campaigns);
            completed++;
            if (completed === campaignObservables.length) {
              // Filter by districtId and remove duplicates
              const uniqueCampaigns = allCampaigns.filter((c, index, self) =>
                index === self.findIndex((camp) => camp.id === c.id) &&
                (c.districtId === districtId || c.nationalId)
              );
              observer.next(uniqueCampaigns);
              observer.complete();
            }
          },
          error: (error) => {
            completed++;
            if (completed === campaignObservables.length) {
              observer.next(allCampaigns.filter(c => c.districtId === districtId || c.nationalId));
              observer.complete();
            }
          }
        });
      });
      
      if (campaignObservables.length === 0) {
        observer.next([]);
        observer.complete();
      }
    });
  }
}

