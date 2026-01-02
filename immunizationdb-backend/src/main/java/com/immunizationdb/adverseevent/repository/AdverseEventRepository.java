package com.immunizationdb.adverseevent.repository;

import com.immunizationdb.adverseevent.entity.AdverseEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AdverseEventRepository extends JpaRepository<AdverseEvent, Long> {
    
    List<AdverseEvent> findByPatientIdOrderByReportedAtDesc(UUID patientId);
    
    List<AdverseEvent> findByVaccinationIdOrderByReportedAtDesc(Long vaccinationId);
    
    boolean existsByPatientIdAndSeverity(UUID patientId, AdverseEvent.Severity severity);
    
    long countByPatientIdAndSeverity(UUID patientId, AdverseEvent.Severity severity);
}

