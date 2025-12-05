package com.immunizationdb.patient.repository;

import com.immunizationdb.patient.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {

    List<Patient> findByFacilityIdAndDeletedFalse(String facilityId);

    Optional<Patient> findByIdAndDeletedFalse(UUID id);

    @Query("SELECT p FROM Patient p WHERE p.facilityId = :facilityId AND p.deleted = false " +
           "AND (LOWER(p.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.guardianName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR p.phoneNumber LIKE CONCAT('%', :searchTerm, '%'))")
    List<Patient> searchPatients(@Param("facilityId") String facilityId, @Param("searchTerm") String searchTerm);

    @Query("SELECT p FROM Patient p WHERE p.facilityId = :facilityId AND p.deleted = false " +
           "AND p.dateOfBirth BETWEEN :startDate AND :endDate")
    List<Patient> findByFacilityIdAndDateOfBirthBetween(
        @Param("facilityId") String facilityId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COUNT(p) FROM Patient p WHERE p.facilityId = :facilityId AND p.deleted = false")
    Long countByFacilityId(@Param("facilityId") String facilityId);

    @Query("SELECT p FROM Patient p WHERE p.deleted = false " +
           "AND p.dateOfBirth >= :minDate " +
           "ORDER BY p.createdAt DESC")
    List<Patient> findRecentPatients(@Param("minDate") LocalDate minDate);
}
