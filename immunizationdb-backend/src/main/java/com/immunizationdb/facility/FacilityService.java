package com.immunizationdb.facility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class FacilityService {
    
    private final FacilityRepository facilityRepository;
    
    public List<Facility> getAllFacilities() {
        log.info("Fetching all facilities");
        return facilityRepository.findAll();
    }
    
    public List<Facility> getAllActiveFacilities() {
        log.info("Fetching all active facilities");
        return facilityRepository.findAllActive();
    }
    
    public Optional<Facility> getFacilityById(String id) {
        log.info("Fetching facility with id: {}", id);
        return facilityRepository.findById(id);
    }
    
    public List<Facility> getFacilitiesByDistrict(String districtId) {
        log.info("Fetching facilities for district: {}", districtId);
        return facilityRepository.findByDistrictId(districtId);
    }
    
    public List<Facility> getFacilitiesByCounty(String county) {
        log.info("Fetching facilities for county: {}", county);
        return facilityRepository.findByCounty(county);
    }
    
    public List<Facility> getFacilitiesByType(String type) {
        log.info("Fetching facilities of type: {}", type);
        return facilityRepository.findByType(type);
    }
    
    @Transactional
    public Facility createFacility(Facility facility) {
        log.info("Creating new facility: {}", facility.getName());
        
        if (facilityRepository.existsById(facility.getId())) {
            throw new IllegalArgumentException("Facility with ID " + facility.getId() + " already exists");
        }
        
        return facilityRepository.save(facility);
    }
    
    @Transactional
    public Facility updateFacility(String id, Facility facilityDetails) {
        log.info("Updating facility with id: {}", id);
        
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found with id: " + id));
        
        facility.setName(facilityDetails.getName());
        facility.setType(facilityDetails.getType());
        facility.setDistrictId(facilityDetails.getDistrictId());
        facility.setCounty(facilityDetails.getCounty());
        facility.setAddress(facilityDetails.getAddress());
        facility.setPhoneNumber(facilityDetails.getPhoneNumber());
        facility.setEmail(facilityDetails.getEmail());
        facility.setCapacity(facilityDetails.getCapacity());
        facility.setActive(facilityDetails.getActive());
        
        return facilityRepository.save(facility);
    }
    
    @Transactional
    public void deleteFacility(String id) {
        log.info("Deleting facility with id: {}", id);
        
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found with id: " + id));
        
        facility.setActive(false);
        facilityRepository.save(facility);
    }
    
    public Long countActiveFacilities() {
        return facilityRepository.countActiveFacilities();
    }
}
