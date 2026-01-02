package com.immunizationdb.inventory.repository;

import com.immunizationdb.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByFacilityId(String facilityId);
    List<StockMovement> findByFacilityIdAndVaccineId(String facilityId, String vaccineId);
    List<StockMovement> findByFacilityIdAndBatchNumber(String facilityId, String batchNumber);
}

