package com.immunizationdb.appointment.repository;

import com.immunizationdb.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {

    List<Appointment> findByFacilityId(String facilityId);

    List<Appointment> findByFacilityIdAndAppointmentDate(String facilityId, LocalDate appointmentDate);

    List<Appointment> findByFacilityIdAndAppointmentDateBetween(
            String facilityId, 
            LocalDate startDate, 
            LocalDate endDate
    );

    List<Appointment> findByPatientId(UUID patientId);

    List<Appointment> findByPatientIdAndStatus(UUID patientId, Appointment.AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.facilityId = :facilityId AND a.appointmentDate = :date AND a.status = :status")
    List<Appointment> findByFacilityIdAndDateAndStatus(
            @Param("facilityId") String facilityId,
            @Param("date") LocalDate date,
            @Param("status") Appointment.AppointmentStatus status
    );

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :startDate AND :endDate AND a.smsSent = false")
    List<Appointment> findAppointmentsNeedingSmsReminder(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    
    List<Appointment> findByAppointmentDateAndSmsSentFalse(LocalDate appointmentDate);
}





