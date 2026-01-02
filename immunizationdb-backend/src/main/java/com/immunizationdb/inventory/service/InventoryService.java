package com.immunizationdb.inventory.service;

import com.immunizationdb.auth.entity.User;
import com.immunizationdb.inventory.dto.AdjustStockRequest;
import com.immunizationdb.inventory.dto.CreateVaccineBatchRequest;
import com.immunizationdb.inventory.dto.ReceiveStockRequest;
import com.immunizationdb.inventory.dto.StockLevelResponse;
import com.immunizationdb.inventory.dto.VaccineBatchResponse;
import com.immunizationdb.inventory.entity.StockMovement;
import com.immunizationdb.inventory.entity.VaccineBatch;
import com.immunizationdb.inventory.repository.StockMovementRepository;
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
    private final StockMovementRepository stockMovementRepository;
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
    public List<VaccineBatchResponse> getAllBatches() {
        return vaccineBatchRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VaccineBatchResponse getBatchById(Long id) {
        VaccineBatch batch = vaccineBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + id));
        return mapToResponse(batch);
    }

    @Transactional
    public VaccineBatchResponse updateBatch(Long id, CreateVaccineBatchRequest request) {
        log.info("Updating vaccine batch with ID: {}", id);
        
        VaccineBatch batch = vaccineBatchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + id));

        // Check for duplicate batch number if changed
        if (!batch.getBatchNumber().equals(request.getBatchNumber())) {
            vaccineBatchRepository.findByBatchNumberAndFacilityId(
                    request.getBatchNumber(), request.getFacilityId()
            ).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Batch number already exists in this facility");
                }
            });
        }

        // Update fields
        batch.setBatchNumber(request.getBatchNumber());
        batch.setVaccineName(request.getVaccineName());
        batch.setManufacturer(request.getManufacturer());
        batch.setQuantityReceived(request.getQuantityReceived());
        // Calculate remaining quantity based on the difference
        int difference = request.getQuantityReceived() - batch.getQuantityReceived();
        batch.setQuantityRemaining(batch.getQuantityRemaining() + difference);
        batch.setExpiryDate(request.getExpiryDate());
        batch.setReceiptDate(request.getReceiptDate());
        batch.setFacilityId(request.getFacilityId());

        VaccineBatch updatedBatch = vaccineBatchRepository.save(batch);
        log.info("Vaccine batch updated successfully");

        return mapToResponse(updatedBatch);
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
    public List<VaccineBatchResponse> findAvailableBatchesByVaccine(String facilityId, String vaccineName) {
        // URL decode the vaccine name in case it was encoded (Spring should handle this automatically, but be safe)
        String decodedVaccineName = vaccineName != null ? vaccineName.trim() : "";
        log.info("Finding available batches for facility: {}, vaccine: '{}' (decoded: '{}')", facilityId, vaccineName, decodedVaccineName);
        
        List<VaccineBatch> batches = vaccineBatchRepository.findAvailableBatchesByVaccine(facilityId, decodedVaccineName, LocalDate.now());
        log.info("Found {} available batches for vaccine: '{}' in facility: {}", batches.size(), decodedVaccineName, facilityId);
        
        return batches.stream()
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

    /**
     * Deduct stock for a vaccination - finds oldest non-expired batch (FIFO) and deducts quantity
     * @param facilityId Facility ID
     * @param vaccineName Vaccine name
     * @param quantity Quantity to deduct (typically 1 for vaccination)
     * @return The batch ID that was used
     */
    @Transactional
    public Long deductStockForVaccine(String facilityId, String vaccineName, Integer quantity) {
        log.info("Deducting stock: {} doses of {} for facility {}", quantity, vaccineName, facilityId);
        
        LocalDate currentDate = LocalDate.now();
        
        // Find oldest non-expired batch (FIFO) - ordered by expiry date ASC
        List<VaccineBatch> availableBatches = vaccineBatchRepository.findAvailableBatchesByVaccine(
                facilityId, vaccineName, currentDate);
        
        if (availableBatches.isEmpty()) {
            throw new RuntimeException("No available stock for vaccine: " + vaccineName + " in facility: " + facilityId);
        }
        
        // Get the oldest batch (first in list since it's ordered by expiry date ASC)
        VaccineBatch batch = availableBatches.get(0);
        
        if (batch.getQuantityRemaining() < quantity) {
            throw new RuntimeException(String.format(
                    "Insufficient stock. Available: %d, requested: %d for batch %s", 
                    batch.getQuantityRemaining(), quantity, batch.getBatchNumber()));
        }
        
        // Deduct quantity
        int newQuantity = batch.getQuantityRemaining() - quantity;
        batch.setQuantityRemaining(newQuantity);
        VaccineBatch updatedBatch = vaccineBatchRepository.save(batch);
        
        // Get current user for stock movement record
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        // Create stock movement record (type: USED)
        StockMovement movement = StockMovement.builder()
                .facilityId(facilityId)
                .vaccineId(vaccineName)
                .batchNumber(batch.getBatchNumber())
                .movementType(StockMovement.MovementType.USED)
                .quantity(quantity)
                .reason("Stock used for vaccination")
                .createdBy(currentUser.getId())
                .build();
        
        stockMovementRepository.save(movement);
        
        // Check if batch is now depleted (quantity reached 0)
        if (newQuantity == 0) {
            log.info("Batch {} is now depleted (quantity reached 0)", batch.getBatchNumber());
            // Note: We don't have an isDepleted field, but quantityRemaining = 0 effectively means depleted
        }
        
        log.info("Stock deducted: {} doses from batch {} (batch ID: {}). Remaining: {}", 
                quantity, batch.getBatchNumber(), updatedBatch.getId(), newQuantity);
        
        return updatedBatch.getId();
    }

    @Transactional
    public void deductStock(Long batchId, Integer quantity) {
        VaccineBatch batch = vaccineBatchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        if (batch.getQuantityRemaining() < quantity) {
            throw new RuntimeException("Insufficient stock. Available: " + batch.getQuantityRemaining());
        }

        // Deduct quantity
        int newQuantity = batch.getQuantityRemaining() - quantity;
        batch.setQuantityRemaining(newQuantity);
        VaccineBatch updatedBatch = vaccineBatchRepository.save(batch);
        
        // Get current user for stock movement record
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        // Create stock movement record (type: USED)
        StockMovement movement = StockMovement.builder()
                .facilityId(batch.getFacilityId())
                .vaccineId(batch.getVaccineName())
                .batchNumber(batch.getBatchNumber())
                .movementType(StockMovement.MovementType.USED)
                .quantity(quantity)
                .reason("Stock used for vaccination")
                .createdBy(currentUser.getId())
                .build();
        
        stockMovementRepository.save(movement);
        
        // Check if batch is now depleted
        if (newQuantity == 0) {
            log.info("Batch {} is now depleted (quantity reached 0)", batch.getBatchNumber());
        }
        
        log.info("Stock deducted: {} doses from batch {} (batch ID: {}). Remaining: {}", 
                quantity, batch.getBatchNumber(), batchId, newQuantity);
    }

    @Transactional
    public void deleteBatch(Long batchId) {
        VaccineBatch batch = vaccineBatchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));
        
        log.info("Deleting vaccine batch with ID: {} (Batch: {})", batchId, batch.getBatchNumber());
        vaccineBatchRepository.delete(batch);
        log.info("Vaccine batch deleted successfully");
    }

    @Transactional
    public VaccineBatchResponse receiveStock(ReceiveStockRequest request) {
        log.info("Receiving stock: batch {} for vaccine {}", request.getBatchNumber(), request.getVaccineId());
        
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String facilityId = currentUser.getFacilityId();
        
        if (facilityId == null || facilityId.isEmpty()) {
            throw new RuntimeException("User facility ID is required");
        }

        String vaccineName = request.getVaccineId(); // Frontend sends vaccine name as vaccineId

        // Check for duplicate batch number per vaccine (not just per facility)
        vaccineBatchRepository.findByBatchNumberAndFacilityId(
                request.getBatchNumber(), facilityId
        ).ifPresent(existing -> {
            // Additional check: ensure it's for the same vaccine
            if (existing.getVaccineName().equalsIgnoreCase(vaccineName)) {
                throw new RuntimeException("Batch number already exists for this vaccine in this facility");
            }
        });

        // Treat vaccineId as vaccineName (frontend sends vaccine name as ID)
        VaccineBatch batch = VaccineBatch.builder()
                .batchNumber(request.getBatchNumber())
                .vaccineName(vaccineName)
                .manufacturer(request.getReceivedFrom() != null ? request.getReceivedFrom() : "Unknown")
                .quantityReceived(request.getQuantity())
                .quantityRemaining(request.getQuantity())
                .expiryDate(request.getExpiryDate())
                .receiptDate(request.getReceivedDate())
                .facilityId(facilityId)
                .createdBy(currentUser.getId())
                .build();

        VaccineBatch savedBatch = vaccineBatchRepository.save(batch);
        log.info("Stock received successfully: batch {} with {} doses", savedBatch.getBatchNumber(), savedBatch.getQuantityReceived());

        // Create stock movement record
        StockMovement movement = StockMovement.builder()
                .facilityId(facilityId)
                .vaccineId(vaccineName)
                .batchNumber(request.getBatchNumber())
                .movementType(StockMovement.MovementType.RECEIVED)
                .quantity(request.getQuantity())
                .reason("Stock received from: " + (request.getReceivedFrom() != null ? request.getReceivedFrom() : "Unknown"))
                .createdBy(currentUser.getId())
                .build();

        stockMovementRepository.save(movement);
        log.info("Stock movement record created: RECEIVED {} doses of {} (batch: {})", 
                request.getQuantity(), vaccineName, request.getBatchNumber());

        return mapToResponse(savedBatch);
    }

    @Transactional
    public VaccineBatchResponse adjustStock(AdjustStockRequest request) {
        log.info("Adjusting stock: batch {} for vaccine {}, change: {}", 
                request.getBatchNumber(), request.getVaccineId(), request.getQuantityChange());
        
        User currentUser = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String facilityId = currentUser.getFacilityId();
        
        if (facilityId == null || facilityId.isEmpty()) {
            throw new RuntimeException("User facility ID is required");
        }

        // Find batch by batch number and vaccine name (frontend sends vaccine name as vaccineId)
        VaccineBatch batch = vaccineBatchRepository.findByBatchNumberAndFacilityId(
                request.getBatchNumber(), facilityId
        ).orElseThrow(() -> new RuntimeException("Batch not found: " + request.getBatchNumber()));

        // Verify vaccine matches
        if (!batch.getVaccineName().equalsIgnoreCase(request.getVaccineId())) {
            throw new RuntimeException("Vaccine mismatch for batch " + request.getBatchNumber());
        }

        // Adjust quantity
        int newQuantity = batch.getQuantityRemaining() + request.getQuantityChange();
        if (newQuantity < 0) {
            throw new RuntimeException("Insufficient stock. Available: " + batch.getQuantityRemaining() + 
                    ", requested adjustment: " + request.getQuantityChange());
        }

        batch.setQuantityRemaining(newQuantity);
        VaccineBatch updatedBatch = vaccineBatchRepository.save(batch);
        
        // Determine movement type based on reason
        StockMovement.MovementType movementType;
        String reasonUpper = request.getReason().toUpperCase();
        switch (reasonUpper) {
            case "DAMAGED":
                movementType = StockMovement.MovementType.DAMAGED;
                break;
            case "EXPIRED":
                movementType = StockMovement.MovementType.EXPIRED;
                break;
            case "LOST":
                movementType = StockMovement.MovementType.USED; // Use USED for lost items
                break;
            case "CORRECTION":
                movementType = StockMovement.MovementType.ADJUSTED;
                break;
            default:
                movementType = StockMovement.MovementType.ADJUSTED;
        }
        
        // Create stock movement record
        String reasonText = request.getReason() + (request.getNotes() != null && !request.getNotes().isEmpty() 
                ? ": " + request.getNotes() : "");
        
        StockMovement movement = StockMovement.builder()
                .facilityId(facilityId)
                .vaccineId(batch.getVaccineName())
                .batchNumber(batch.getBatchNumber())
                .movementType(movementType)
                .quantity(Math.abs(request.getQuantityChange())) // Use absolute value
                .reason(reasonText)
                .createdBy(currentUser.getId())
                .build();
        
        stockMovementRepository.save(movement);
        log.info("Stock movement record created: {} {} doses of {} (batch: {}, reason: {})", 
                movementType, Math.abs(request.getQuantityChange()), batch.getVaccineName(), 
                batch.getBatchNumber(), request.getReason());
        
        // Check if batch is now depleted
        if (newQuantity == 0) {
            log.info("Batch {} is now depleted (quantity reached 0)", batch.getBatchNumber());
        }
        
        log.info("Stock adjusted: batch {} now has {} doses (reason: {})", 
                updatedBatch.getBatchNumber(), updatedBatch.getQuantityRemaining(), request.getReason());

        return mapToResponse(updatedBatch);
    }

    @Transactional(readOnly = true)
    public List<StockLevelResponse> getStockLevels(String facilityId) {
        List<VaccineBatch> batches = vaccineBatchRepository.findByFacilityId(facilityId);
        
        // Group by vaccine name and aggregate
        java.util.Map<String, java.util.List<VaccineBatch>> vaccineGroups = batches.stream()
                .filter(b -> !b.isExpired() && b.getQuantityRemaining() > 0) // Only non-expired, non-depleted batches
                .collect(Collectors.groupingBy(VaccineBatch::getVaccineName));
        
        List<StockLevelResponse> stockLevels = new java.util.ArrayList<>();
        
        for (java.util.Map.Entry<String, java.util.List<VaccineBatch>> entry : vaccineGroups.entrySet()) {
            String vaccineName = entry.getKey();
            List<VaccineBatch> vaccineBatches = entry.getValue();
            
            // Calculate total quantity
            int totalQuantity = vaccineBatches.stream()
                    .mapToInt(VaccineBatch::getQuantityRemaining)
                    .sum();
            
            // Find oldest expiry date
            LocalDate oldestExpiry = vaccineBatches.stream()
                    .map(VaccineBatch::getExpiryDate)
                    .min(LocalDate::compareTo)
                    .orElse(null);
            
            // Determine status based on quantity: >50 = GOOD, 10-50 = LOW, <10 = CRITICAL
            String status;
            if (totalQuantity > 50) {
                status = "GOOD";
            } else if (totalQuantity >= 10) {
                status = "LOW";
            } else {
                status = "CRITICAL";
            }
            
            stockLevels.add(StockLevelResponse.builder()
                    .vaccineId(vaccineName.toLowerCase().replace(" ", "-"))
                    .vaccineName(vaccineName)
                    .currentQuantity(totalQuantity)
                    .oldestExpiryDate(oldestExpiry)
                    .status(status)
                    .build());
        }
        
        // Sort by vaccine name
        stockLevels.sort((a, b) -> a.getVaccineName().compareToIgnoreCase(b.getVaccineName()));
        
        return stockLevels;
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
