package com.immunizationdb.inventory.service;

import com.immunizationdb.auth.entity.User;
import com.immunizationdb.inventory.dto.CreateVaccineBatchRequest;
import com.immunizationdb.inventory.dto.VaccineBatchResponse;
import com.immunizationdb.inventory.entity.VaccineBatch;
import com.immunizationdb.inventory.repository.VaccineBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final VaccineBatchRepository vaccineBatchRepository;
    private static final int EXPIRY_WARNING_DAYS = 30;

    @Transactional
    public VaccineBatchResponse createBatch(CreateVaccineBatchRequest request) {
        log.info("Creating new vaccine batch: {}", request.getBatchNumber());

        // Check for duplicate batch number in facility
        vaccineBatchRepository.findByBatchNumberAndFacilityId(
                request.getBatchNumber(), request.getFacilityId()
        ).ifPresent(existing -> {
            throw new RuntimeException("Batch number already exists in this facility");
        });

        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        VaccineBatch batch = VaccineBatch.builder()
                .batchNumber(request.getBatchNumber())
                .vaccineName(request.getVaccineName())
                .manufacturer(request.getManufacturer())
                .quantityReceived(request.getQuantityReceived())
                .quantityRemaining(request.getQuantityReceived())
                .expiryDate(request.getExpiryDate())
                .receiptDate(request.getReceiptDate())
                .facilityId(request.getFacilityId())
                .createdBy(currentUser.getId())
                .build();

        VaccineBatch savedBatch = vaccineBatchRepository.save(batch);
        log.info("Vaccine batch created successfully with ID: {}", savedBatch.getId());

        return mapToResponse(savedBatch);
    }

    @Transactional(readOnly = true)
    public List<VaccineBatchResponse> getBatchesByFacility(String facilityId) {
        return vaccineBatchRepository.findByFacilityId(facilityId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccineBatchResponse> getAvailableBatches(String facilityId) {
        return vaccineBatchRepository.findAvailableBatches(facilityId, LocalDate.now())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VaccineBatchResponse> getExpiringSoonBatches(String facilityId) {
        LocalDate now = LocalDate.now();
        LocalDate warningDate = now.plusDays(EXPIRY_WARNING_DAYS);
        return vaccineBatchRepository.findBatchesExpiringSoon(facilityId, now, warningDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deductStock(Long batchId, Integer quantity) {
        VaccineBatch batch = vaccineBatchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        if (batch.getQuantityRemaining() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + batch.getQuantityRemaining());
        }

        batch.setQuantityRemaining(batch.getQuantityRemaining() - quantity);
        vaccineBatchRepository.save(batch);
        log.info("Stock deducted: {} doses from batch {}", quantity, batchId);
    }

    @Transactional
    public void deleteBatch(Long batchId) {
        VaccineBatch batch = vaccineBatchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));
        
        log.info("Deleting vaccine batch with ID: {} (Batch: {})", batchId, batch.getBatchNumber());
        vaccineBatchRepository.delete(batch);
        log.info("Vaccine batch deleted successfully");
    }

    private VaccineBatchResponse mapToResponse(VaccineBatch batch) {
        LocalDate now = LocalDate.now();
        long daysUntilExpiry = ChronoUnit.DAYS.between(now, batch.getExpiryDate());

        return VaccineBatchResponse.builder()
                .id(batch.getId())
                .batchNumber(batch.getBatchNumber())
                .vaccineName(batch.getVaccineName())
                .manufacturer(batch.getManufacturer())
                .quantityReceived(batch.getQuantityReceived())
                .quantityRemaining(batch.getQuantityRemaining())
                .expiryDate(batch.getExpiryDate())
                .receiptDate(batch.getReceiptDate())
                .facilityId(batch.getFacilityId())
                .createdAt(batch.getCreatedAt())
                .isExpired(batch.isExpired())
                .isExpiringSoon(batch.isExpiringSoon(EXPIRY_WARNING_DAYS))
                .daysUntilExpiry((int) daysUntilExpiry)
                .build();
    }
}
