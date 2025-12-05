import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Campaign, CreateCampaignRequest, CampaignStatus } from '../models/campaign.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private apiUrl = `${environment.apiUrl}/campaigns`;

  constructor(private http: HttpClient) { }

  createCampaign(request: CreateCampaignRequest): Observable<Campaign> {
    return this.http.post<Campaign>(this.apiUrl, request);
  }

  getActiveCampaigns(facilityId?: string): Observable<Campaign[]> {
    const options = facilityId ? { params: { facilityId } } : {};
    return this.http.get<Campaign[]>(`${this.apiUrl}/active`, options);
  }

  getCampaignsByFacility(facilityId: string): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiUrl}/facility/${facilityId}`);
  }

  updateCampaignStatus(campaignId: number, status: CampaignStatus): Observable<Campaign> {
    return this.http.patch<Campaign>(`${this.apiUrl}/${campaignId}/status`, null, {
      params: { status }
    });
  }
}
