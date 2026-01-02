package com.immunizationdb.vaccination.repository;

import com.immunizationdb.vaccination.entity.Vaccination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {

    List<Vaccination> findByPatientIdOrderByDateAdministeredDesc(UUID patientId);

    List<Vaccination> findByFacilityId(String facilityId);

    @Query("SELECT v FROM Vaccination v WHERE v.facilityId = :facilityId " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate")
    List<Vaccination> findByFacilityIdAndDateRange(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(v) FROM Vaccination v WHERE v.facilityId = :facilityId " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate")
    Long countByFacilityIdAndDateRange(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(DISTINCT v.patientId) FROM Vaccination v WHERE v.facilityId = :facilityId " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate")
    Long countUniquePatients(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT v.vaccineName, COUNT(v) FROM Vaccination v " +
           "WHERE v.facilityId = :facilityId " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate " +
           "GROUP BY v.vaccineName")
    List<Object[]> getVaccinationStatsByVaccine(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT v FROM Vaccination v WHERE v.batchId = :batchId")
    List<Vaccination> findByBatchId(@Param("batchId") Long batchId);

    @Query("SELECT v FROM Vaccination v WHERE v.nurseId = :nurseId " +
           "ORDER BY v.dateAdministered DESC")
    List<Vaccination> findByNurseId(@Param("nurseId") Long nurseId);

    boolean existsByPatientIdAndVaccineNameAndDoseNumber(UUID patientId, String vaccineName, Integer doseNumber);

    @Query("SELECT COUNT(v) FROM Vaccination v WHERE v.facilityId = :facilityId " +
           "AND v.vaccineName = :vaccineName " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate")
    Long countByVaccineAndDateRange(
        @Param("facilityId") String facilityId,
        @Param("vaccineName") String vaccineName,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(v) FROM Vaccination v WHERE v.facilityId = :facilityId")
    Long countByFacilityId(@Param("facilityId") String facilityId);

    @Query("SELECT COUNT(v) FROM Vaccination v WHERE v.facilityId = :facilityId " +
           "AND (v.vaccineName = 'Penta' OR v.vaccineName = 'DTP') " +
           "AND v.doseNumber = :doseNumber " +
           "AND v.dateAdministered BETWEEN :startDate AND :endDate")
    Long countPentaDoseByFacilityAndDateRange(
        @Param("facilityId") String facilityId,
        @Param("doseNumber") Integer doseNumber,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
