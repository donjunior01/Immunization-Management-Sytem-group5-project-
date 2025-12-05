package com.immunizationdb.inventory.repository;

import com.immunizationdb.inventory.entity.VaccineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VaccineBatchRepository extends JpaRepository<VaccineBatch, Long> {

    List<VaccineBatch> findByFacilityId(String facilityId);

    Optional<VaccineBatch> findByBatchNumberAndFacilityId(String batchNumber, String facilityId);

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.facilityId = :facilityId " +
           "AND vb.quantityRemaining > 0 AND vb.expiryDate > :currentDate " +
           "ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findAvailableBatches(
        @Param("facilityId") String facilityId,
        @Param("currentDate") LocalDate currentDate
    );

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.facilityId = :facilityId " +
           "AND vb.vaccineName = :vaccineName AND vb.quantityRemaining > 0 " +
           "AND vb.expiryDate > :currentDate ORDER BY vb.expiryDate ASC")
    List<VaccineBatch> findAvailableBatchesByVaccine(
        @Param("facilityId") String facilityId,
        @Param("vaccineName") String vaccineName,
        @Param("currentDate") LocalDate currentDate
    );

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.facilityId = :facilityId " +
           "AND vb.expiryDate BETWEEN :startDate AND :endDate " +
           "AND vb.quantityRemaining > 0")
    List<VaccineBatch> findBatchesExpiringSoon(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT vb FROM VaccineBatch vb WHERE vb.facilityId = :facilityId " +
           "AND vb.expiryDate < :currentDate AND vb.quantityRemaining > 0")
    List<VaccineBatch> findExpiredBatches(
        @Param("facilityId") String facilityId,
        @Param("currentDate") LocalDate currentDate
    );

    @Query("SELECT SUM(vb.quantityRemaining) FROM VaccineBatch vb " +
           "WHERE vb.facilityId = :facilityId AND vb.vaccineName = :vaccineName " +
           "AND vb.expiryDate > :currentDate")
    Long getTotalAvailableQuantity(
        @Param("facilityId") String facilityId,
        @Param("vaccineName") String vaccineName,
        @Param("currentDate") LocalDate currentDate
    );

    @Query("SELECT DISTINCT vb.vaccineName FROM VaccineBatch vb WHERE vb.facilityId = :facilityId")
    List<String> findDistinctVaccineNames(@Param("facilityId") String facilityId);
}
