package com.immunizationdb.facility;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, String> {
    
    List<Facility> findByActive(Boolean active);
    
    List<Facility> findByDistrictId(String districtId);
    
    List<Facility> findByCounty(String county);
    
    List<Facility> findByType(String type);
    
    @Query("SELECT f FROM Facility f WHERE f.active = true AND f.districtId = :districtId")
    List<Facility> findActiveByDistrict(String districtId);
    
    @Query("SELECT f FROM Facility f WHERE f.active = true ORDER BY f.name")
    List<Facility> findAllActive();
    
    Optional<Facility> findByIdAndActive(String id, Boolean active);
    
    @Query("SELECT COUNT(f) FROM Facility f WHERE f.active = true")
    Long countActiveFacilities();
    
    @Query("SELECT f.districtId, COUNT(f) FROM Facility f WHERE f.active = true GROUP BY f.districtId")
    List<Object[]> countFacilitiesByDistrict();
}
