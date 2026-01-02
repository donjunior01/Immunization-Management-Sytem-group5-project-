package com.immunizationdb.sms.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.immunizationdb.sms.entity.SmsLog;
import com.immunizationdb.sms.repository.SmsLogRepository;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private final SmsLogRepository smsLogRepository;
    private final WebClient.Builder webClientBuilder;
    
    @Value("${sms.africastalking.api-key:}")
    private String apiKey;
    
    @Value("${sms.africastalking.username:}")
    private String username;
    
    @Value("${sms.africastalking.sender-id}")
    private String senderId;
    
    @Value("${sms.africastalking.enabled:true}")
    private boolean smsEnabled;
    
    private static final String AFRICASTALKING_API_URL = "https://api.africastalking.com/version1/messaging";
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{1,14}$");
    
    @PostConstruct
    public void init() {
        log.info("SMS Service initialized - Username configured: {}, API Key configured: {}, SMS Enabled: {}", 
                username != null && !username.trim().isEmpty() && !username.equals("your_username_here"),
                apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("your_api_key_here"),
                smsEnabled);
        if (username == null || username.trim().isEmpty() || username.equals("your_username_here")) {
            log.warn("SMS username is not properly configured. Current value: '{}'", username);
        }
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("your_api_key_here")) {
            log.warn("SMS API key is not properly configured.");
        }
    }
    
    /**
     * Validate phone number format
     */
    private boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        // Remove spaces and dashes
        String cleaned = phone.replaceAll("[\\s-]", "");
        return PHONE_PATTERN.matcher(cleaned).matches();
    }
    
    /**
     * Normalize phone number (ensure it starts with +)
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }
        String cleaned = phone.replaceAll("[\\s-]", "");
        if (!cleaned.startsWith("+")) {
            // Assume it's a Kenyan number if it starts with 0 or doesn't have country code
            if (cleaned.startsWith("0")) {
                cleaned = "+254" + cleaned.substring(1);
            } else if (cleaned.startsWith("254")) {
                cleaned = "+" + cleaned;
            } else {
                cleaned = "+254" + cleaned;
            }
        }
        return cleaned;
    }
    
    /**
     * Send SMS message using AfricasTalking REST API
     * @param phone Recipient phone number
     * @param message Message content
     * @param appointmentId Optional appointment ID
     * @param patientId Optional patient ID
     * @return SmsLog with status
     */
    @Transactional
    public SmsLog sendSMS(String phone, String message, UUID appointmentId, UUID patientId) {
        log.info("Attempting to send SMS to: {}", phone);
        
        // Validate phone number
        if (!isValidPhoneNumber(phone)) {
            log.error("Invalid phone number format: {}", phone);
            SmsLog smsLog = SmsLog.builder()
                    .recipientPhone(phone)
                    .message(message)
                    .status(SmsLog.SmsStatus.FAILED)
                    .errorMessage("Invalid phone number format")
                    .appointmentId(appointmentId)
                    .patientId(patientId)
                    .build();
            return smsLogRepository.save(smsLog);
        }
        
        // Normalize phone number
        String normalizedPhone = normalizePhoneNumber(phone);
        
        // Check if SMS is enabled
        if (!smsEnabled) {
            log.warn("SMS is disabled. Message would be sent to: {}", normalizedPhone);
            SmsLog smsLog = SmsLog.builder()
                    .recipientPhone(normalizedPhone)
                    .message(message)
                    .status(SmsLog.SmsStatus.PENDING)
                    .errorMessage("SMS service is disabled")
                    .appointmentId(appointmentId)
                    .patientId(patientId)
                    .build();
            return smsLogRepository.save(smsLog);
        }
        
        // Create SMS log entry
        SmsLog smsLog = SmsLog.builder()
                .recipientPhone(normalizedPhone)
                .message(message)
                .status(SmsLog.SmsStatus.PENDING)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .build();
        
        smsLog = smsLogRepository.save(smsLog);
        
        try {
            // Debug: Log the actual values (without exposing sensitive data)
            log.debug("SMS Configuration - Username present: {}, API Key present: {}", 
                    username != null && !username.trim().isEmpty(), 
                    apiKey != null && !apiKey.trim().isEmpty());
            
            // Validate credentials are set
            if (username == null || username.trim().isEmpty() || username.equals("your_username_here")) {
                log.error("AfricasTalking username is not configured. Current value: '{}'. Please set AFRICASTALKING_USERNAME environment variable or update application.yml", username);
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage("SMS gateway not configured: username missing");
                return smsLogRepository.save(smsLog);
            }
            
            if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("your_api_key_here")) {
                log.error("AfricasTalking API key is not configured. Please set AFRICASTALKING_API_KEY environment variable or update application.yml");
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage("SMS gateway not configured: API key missing");
                return smsLogRepository.save(smsLog);
            }
            
            // Build WebClient with Basic Authentication
            // AfricasTalking uses Basic Auth with username and API key
            String credentials = username.trim() + ":" + apiKey.trim();
            String encodedCredentials = java.util.Base64.getEncoder().encodeToString(credentials.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            log.debug("Sending SMS to {} using username: {} (credentials length: {})", normalizedPhone, username, credentials.length());
            
            WebClient webClient = webClientBuilder
                    .baseUrl(AFRICASTALKING_API_URL)
                    .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .build();
            
            // Prepare request body
            String requestBody = String.format(
                    "username=%s&to=%s&message=%s&from=%s",
                    username,
                    normalizedPhone,
                    java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8),
                    senderId != null ? senderId : ""
            );
            
            log.debug("SMS request body: username={}, to={}, from={}", username, normalizedPhone, senderId);
            
            // Send SMS via REST API with error handling
            AfricasTalkingResponse response = webClient.post()
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + encodedCredentials)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> {
                            log.error("AfricasTalking API error: Status {}", clientResponse.statusCode());
                            return clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("No error body")
                                    .flatMap(errorBody -> {
                                        log.error("Error response body: {}", errorBody);
                                        return reactor.core.publisher.Mono.error(
                                                new RuntimeException("API Error: " + clientResponse.statusCode() + " - " + errorBody)
                                        );
                                    });
                        }
                    )
                    .bodyToMono(AfricasTalkingResponse.class)
                    .block();
            
            if (response != null && response.getSMSMessageData() != null) {
                AfricasTalkingSmsMessageData messageData = response.getSMSMessageData();
                if (messageData.getRecipients() != null && !messageData.getRecipients().isEmpty()) {
                    AfricasTalkingRecipient recipient = messageData.getRecipients().get(0);
                    if ("Success".equalsIgnoreCase(recipient.getStatus()) || 
                        recipient.getStatusCode() == 101) {
                        smsLog.setStatus(SmsLog.SmsStatus.SENT);
                        log.info("SMS sent successfully to: {}", normalizedPhone);
                    } else {
                        smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                        smsLog.setErrorMessage("Gateway error: " + recipient.getStatus() + " (Code: " + recipient.getStatusCode() + ")");
                        log.error("Failed to send SMS to {}: {}", normalizedPhone, recipient.getStatus());
                    }
                } else {
                    smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                    smsLog.setErrorMessage("No recipients in response");
                    log.error("No recipients in response for: {}", normalizedPhone);
                }
            } else {
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage("Invalid response from SMS gateway");
                log.error("Invalid response from SMS gateway for: {}", normalizedPhone);
            }
            
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            log.error("WebClient error while sending SMS to {}: Status {} - Body: {}", 
                    normalizedPhone, e.getStatusCode(), e.getResponseBodyAsString());
            smsLog.setStatus(SmsLog.SmsStatus.FAILED);
            String errorMsg = "Gateway failure: " + e.getStatusCode();
            if (e.getStatusCode().value() == 401) {
                errorMsg += " Unauthorized - Please verify your AfricasTalking API credentials (username and API key) in application.yml or environment variables";
            }
            smsLog.setErrorMessage(errorMsg);
        } catch (Exception e) {
            log.error("Exception while sending SMS to {}: {}", normalizedPhone, e.getMessage(), e);
            smsLog.setStatus(SmsLog.SmsStatus.FAILED);
            smsLog.setErrorMessage("Gateway failure: " + e.getMessage());
        }
        
        return smsLogRepository.save(smsLog);
    }
    
    /**
     * Send SMS message (simplified version without appointment/patient IDs)
     */
    @Transactional
    public SmsLog sendSMS(String phone, String message) {
        return sendSMS(phone, message, null, null);
    }
    
    /**
     * Get SMS logs with optional filters
     */
    public List<SmsLog> getSmsLogs(java.time.LocalDateTime startDate, 
                                   java.time.LocalDateTime endDate,
                                   SmsLog.SmsStatus status,
                                   String recipientPhone) {
        if (startDate != null || endDate != null || status != null || recipientPhone != null) {
            return smsLogRepository.findWithFilters(
                    startDate != null ? startDate : java.time.LocalDateTime.of(2000, 1, 1, 0, 0),
                    endDate != null ? endDate : java.time.LocalDateTime.now(),
                    status,
                    recipientPhone
            );
        }
        return smsLogRepository.findAll();
    }
    
    /**
     * Get SMS log by ID
     */
    public SmsLog getSmsLogById(Long id) {
        return smsLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SMS log not found: " + id));
    }
    
    // Response DTOs for AfricasTalking API
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AfricasTalkingResponse {
        @JsonProperty("SMSMessageData")
        private AfricasTalkingSmsMessageData SMSMessageData;
        
        public AfricasTalkingSmsMessageData getSMSMessageData() {
            return SMSMessageData;
        }
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AfricasTalkingSmsMessageData {
        private String message;
        private List<AfricasTalkingRecipient> recipients;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AfricasTalkingRecipient {
        private String statusCode;
        private Integer statusCodeInt;
        private String number;
        private String status;
        private String cost;
        private String messageId;
        
        public Integer getStatusCode() {
            if (statusCodeInt != null) {
                return statusCodeInt;
            }
            try {
                return Integer.parseInt(statusCode);
            } catch (NumberFormatException e) {
                return null;
            }
        }
    }
}
