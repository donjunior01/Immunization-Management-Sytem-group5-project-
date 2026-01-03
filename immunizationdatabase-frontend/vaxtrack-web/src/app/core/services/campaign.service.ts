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

  getAllCampaigns(facilityId?: string): Observable<Campaign[]> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:58',message:'getAllCampaigns called',data:{apiUrl:this.apiUrl,fullUrl:`${this.apiUrl}/api/campaigns`,hasFacilityId:!!facilityId,facilityId:facilityId||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    const url = `${this.apiUrl}/api/campaigns`;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:67',message:'Making HTTP GET request for all campaigns',data:{url,paramsCount:params.keys().length,params:Array.from(params.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return this.http.get<any[]>(url, { params }).pipe(
      // #region agent log
      tap((response) => {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:71',message:'HTTP response received',data:{responseCount:response?.length||0,isArray:Array.isArray(response),firstItem:response?.[0]?.['id']||'none',responseSample:JSON.stringify(response).substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }),
      // #endregion
      // Map backend response to frontend Campaign interface
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
      }),
      // #region agent log
      tap((mappedCampaigns) => {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:95',message:'Campaigns mapped to frontend interface',data:{mappedCount:mappedCampaigns.length,firstCampaignId:mappedCampaigns[0]?.id||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      })
      // #endregion
    );
  }

  getActiveCampaigns(facilityId?: string): Observable<Campaign[]> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:58',message:'getActiveCampaigns called',data:{apiUrl:this.apiUrl,fullUrl:`${this.apiUrl}/api/campaigns/active`,hasFacilityId:!!facilityId,facilityId:facilityId||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    let params = new HttpParams();
    if (facilityId) {
      params = params.set('facilityId', facilityId);
    }
    const url = `${this.apiUrl}/api/campaigns/active`;
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:65',message:'Making HTTP GET request',data:{url,paramsCount:params.keys().length,params:Array.from(params.keys())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return this.http.get<any[]>(url, { params }).pipe(
      // #region agent log
      tap((response) => {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:71',message:'HTTP response received',data:{responseCount:response?.length||0,isArray:Array.isArray(response),firstItem:response?.[0]?.['id']||'none',responseSample:JSON.stringify(response).substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }),
      // #endregion
      // Map backend response to frontend Campaign interface
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
      }),
      // #region agent log
      tap((mappedCampaigns) => {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:95',message:'Campaigns mapped to frontend interface',data:{mappedCount:mappedCampaigns.length,firstCampaignId:mappedCampaigns[0]?.id||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      })
      // #endregion
    );
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:165',message:'createCampaign called',data:{campaignName:campaign.name,url:`${this.apiUrl}/api/campaigns`,requestBody:JSON.stringify(campaign).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    return this.http.post<any>(`${this.apiUrl}/api/campaigns`, campaign).pipe(
      // #region agent log
      tap((response) => {
        fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:169',message:'Campaign creation response received',data:{campaignId:response?.id,campaignName:response?.name,responseSample:JSON.stringify(response).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      }),
      // #endregion
      // Map backend response to frontend Campaign interface
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

  updateCampaignStatus(campaignId: number, status: Campaign['status']): Observable<Campaign> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/beb0f3e8-0ff1-4b21-b2a4-519a994a184e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'campaign.service.ts:91',message:'updateCampaignStatus called',data:{campaignId,status,url:`${this.apiUrl}/api/campaigns/${campaignId}/status`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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

