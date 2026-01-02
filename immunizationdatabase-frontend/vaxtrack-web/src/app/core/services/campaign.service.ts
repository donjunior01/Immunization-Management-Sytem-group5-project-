import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  nationalId?: boolean;
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

  getActiveCampaigns(facilityId?: string): Observable<Campaign[]> {
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/active`, { params });
  }

  getCampaignsByFacility(facilityId: string): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/facility/${facilityId}`);
  }

  getCampaignsByDistrict(districtId: string): Observable<Campaign[]> {
    // Get all facilities in district, then get campaigns for each
    // For now, we'll use active campaigns endpoint with district filter
    return this.http.get<Campaign[]>(`${this.apiUrl}/api/campaigns/active`);
  }

  createCampaign(campaign: CreateCampaignRequest): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/api/campaigns`, campaign);
  }

  updateCampaignStatus(campaignId: number, status: Campaign['status']): Observable<Campaign> {
    const params = new HttpParams().set('status', status);
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

