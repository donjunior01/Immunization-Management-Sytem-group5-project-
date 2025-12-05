package com.immunizationdb.campaign.controller;

import com.immunizationdb.campaign.dto.CreateCampaignRequest;
import com.immunizationdb.campaign.dto.CampaignResponse;
import com.immunizationdb.campaign.entity.Campaign;
import com.immunizationdb.campaign.service.CampaignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/campaigns")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<CampaignResponse> createCampaign(@Valid @RequestBody CreateCampaignRequest request) {
        CampaignResponse response = campaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<CampaignResponse>> getActiveCampaigns(
            @RequestParam(required = false) String facilityId) {
        List<CampaignResponse> campaigns = campaignService.getActiveCampaigns(facilityId);
        return ResponseEntity.ok(campaigns);
    }

    @GetMapping("/facility/{facilityId}")
    @PreAuthorize("hasAnyRole('HEALTH_WORKER', 'FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<List<CampaignResponse>> getCampaignsByFacility(@PathVariable String facilityId) {
        List<CampaignResponse> campaigns = campaignService.getCampaignsByFacility(facilityId);
        return ResponseEntity.ok(campaigns);
    }

    @PatchMapping("/{campaignId}/status")
    @PreAuthorize("hasAnyRole('FACILITY_MANAGER', 'GOVERNMENT_OFFICIAL')")
    public ResponseEntity<CampaignResponse> updateCampaignStatus(
            @PathVariable Long campaignId,
            @RequestParam Campaign.CampaignStatus status) {
        CampaignResponse response = campaignService.updateCampaignStatus(campaignId, status);
        return ResponseEntity.ok(response);
    }
}
