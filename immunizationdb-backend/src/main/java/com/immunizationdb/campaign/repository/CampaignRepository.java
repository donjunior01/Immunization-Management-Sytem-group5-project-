package com.immunizationdb.campaign.repository;

import com.immunizationdb.campaign.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {

    List<Campaign> findByFacilityId(String facilityId);

    List<Campaign> findByDistrictId(String districtId);

    @Query("SELECT c FROM Campaign c WHERE c.status = :status")
    List<Campaign> findByStatus(@Param("status") Campaign.CampaignStatus status);

    @Query("SELECT c FROM Campaign c WHERE c.facilityId = :facilityId " +
           "AND c.status = :status")
    List<Campaign> findByFacilityIdAndStatus(
        @Param("facilityId") String facilityId,
        @Param("status") Campaign.CampaignStatus status
    );

    @Query("SELECT c FROM Campaign c WHERE :currentDate BETWEEN c.startDate AND c.endDate " +
           "AND c.status = 'ACTIVE'")
    List<Campaign> findActiveCampaigns(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT c FROM Campaign c WHERE c.facilityId = :facilityId " +
           "AND :currentDate BETWEEN c.startDate AND c.endDate " +
           "AND c.status = 'ACTIVE'")
    List<Campaign> findActiveCampaignsByFacility(
        @Param("facilityId") String facilityId,
        @Param("currentDate") LocalDate currentDate
    );

    @Query("SELECT c FROM Campaign c WHERE c.endDate < :currentDate " +
           "AND c.status != 'COMPLETED' AND c.status != 'CANCELLED'")
    List<Campaign> findExpiredCampaigns(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT c FROM Campaign c WHERE c.startDate >= :startDate " +
           "ORDER BY c.startDate ASC")
    List<Campaign> findUpcomingCampaigns(@Param("startDate") LocalDate startDate);
}
