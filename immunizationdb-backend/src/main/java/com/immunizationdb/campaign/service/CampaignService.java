package com.immunizationdb.campaign.service;

import com.immunizationdb.auth.entity.User;
import com.immunizationdb.campaign.dto.CreateCampaignRequest;
import com.immunizationdb.campaign.dto.CampaignResponse;
import com.immunizationdb.campaign.entity.Campaign;
import com.immunizationdb.campaign.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    private final CampaignRepository campaignRepository;

    @Transactional
    public CampaignResponse createCampaign(CreateCampaignRequest request) {
        log.info("Creating new campaign: {}", request.getName());

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        Campaign campaign = Campaign.builder()
                .name(request.getName())
                .description(request.getDescription())
                .vaccineName(request.getVaccineName())
                .targetAgeGroup(request.getTargetAgeGroup())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .targetPopulation(request.getTargetPopulation())
                .vaccinatedCount(0)
                .status(Campaign.CampaignStatus.PLANNED)
                .facilityId(request.getFacilityId())
                .districtId(request.getDistrictId())
                .nationalId(request.getNationalId())
                .createdBy(currentUser.getId())
                .build();

        Campaign savedCampaign = campaignRepository.save(campaign);
        log.info("Campaign created successfully with ID: {}", savedCampaign.getId());

        return mapToResponse(savedCampaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getActiveCampaigns(String facilityId) {
        if (facilityId != null) {
            return campaignRepository.findActiveCampaignsByFacility(facilityId, LocalDate.now())
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return campaignRepository.findActiveCampaigns(LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getCampaignsByFacility(String facilityId) {
        return campaignRepository.findByFacilityId(facilityId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getAllCampaigns(String facilityId) {
        if (facilityId != null) {
            return campaignRepository.findByFacilityId(facilityId)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
        return campaignRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CampaignResponse updateCampaignStatus(Long campaignId, Campaign.CampaignStatus status) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        campaign.setStatus(status);
        Campaign updated = campaignRepository.save(campaign);
        log.info("Campaign {} status updated to {}", campaignId, status);
        return mapToResponse(updated);
    }

    @Transactional
    public void incrementVaccinatedCount(Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        campaign.setVaccinatedCount(campaign.getVaccinatedCount() + 1);
        campaignRepository.save(campaign);
    }

    private CampaignResponse mapToResponse(Campaign campaign) {
        return CampaignResponse.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .vaccineName(campaign.getVaccineName())
                .targetAgeGroup(campaign.getTargetAgeGroup())
                .startDate(campaign.getStartDate())
                .endDate(campaign.getEndDate())
                .targetPopulation(campaign.getTargetPopulation())
                .vaccinatedCount(campaign.getVaccinatedCount())
                .status(campaign.getStatus())
                .facilityId(campaign.getFacilityId())
                .districtId(campaign.getDistrictId())
                .nationalId(campaign.getNationalId())
                .createdAt(campaign.getCreatedAt())
                .coveragePercentage(campaign.getCoveragePercentage())
                .build();
    }
}
