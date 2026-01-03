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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
        
        // Declare trimmed credentials outside try block so they're accessible in catch blocks
        String trimmedUsername = "";
        String trimmedApiKey = "";
        
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
            trimmedUsername = username != null ? username.trim() : "";
            trimmedApiKey = apiKey != null ? apiKey.trim() : "";
            
            // Log credential status (without exposing sensitive data)
            log.info("SMS Authentication - Username length: {}, API Key length: {}, Username empty: {}, API Key empty: {}", 
                    trimmedUsername.length(), trimmedApiKey.length(), trimmedUsername.isEmpty(), trimmedApiKey.isEmpty());
            
            if (trimmedUsername.isEmpty() || trimmedApiKey.isEmpty()) {
                log.error("SMS credentials are empty - Username: '{}', API Key length: {}", 
                        trimmedUsername.isEmpty() ? "EMPTY" : trimmedUsername, trimmedApiKey.length());
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage("SMS gateway credentials are empty. Please check application.yml or environment variables.");
                return smsLogRepository.save(smsLog);
            }
            
            String credentials = trimmedUsername + ":" + trimmedApiKey;
            String encodedCredentials = java.util.Base64.getEncoder().encodeToString(credentials.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            log.info("Sending SMS to {} using username: {} (credentials encoded length: {}, auth header prefix: {})", 
                    normalizedPhone, trimmedUsername, encodedCredentials.length(), 
                    encodedCredentials.length() > 0 ? encodedCredentials.substring(0, Math.min(10, encodedCredentials.length())) : "EMPTY");
            
            // Build WebClient with Basic Authentication configured at the builder level
            // This ensures authentication is properly applied to all requests
            WebClient webClient = webClientBuilder
                    .baseUrl(AFRICASTALKING_API_URL)
                    .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + encodedCredentials)
                    .build();
            
            log.debug("WebClient built with base URL: {} and default Authorization header", AFRICASTALKING_API_URL);
            
            // Prepare request body
            // AfricasTalking API requires username in both Basic Auth header AND in form data
            String requestBody = String.format(
                    "username=%s&to=%s&message=%s&from=%s",
                    java.net.URLEncoder.encode(trimmedUsername, java.nio.charset.StandardCharsets.UTF_8),
                    normalizedPhone,
                    java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8),
                    senderId != null ? java.net.URLEncoder.encode(senderId, java.nio.charset.StandardCharsets.UTF_8) : ""
            );
            
            log.debug("SMS request body prepared: username={}, to={}, from={}, message length={}", 
                    trimmedUsername, normalizedPhone, senderId, message.length());
            
            // Send SMS via REST API with retry logic and error handling
            AfricasTalkingResponse response = null;
            int maxRetries = 3;
            int retryCount = 0;
            long retryDelayMs = 1000; // Start with 1 second delay
            
            while (retryCount < maxRetries) {
                try {
                    log.info("SMS Request - Attempt {}: Sending to {}, Phone: {}, Message length: {}", 
                            retryCount + 1, AFRICASTALKING_API_URL, normalizedPhone, message.length());
                    
                    response = webClient.post()
                            .uri("") // Use relative URI since baseUrl is already set in builder
                            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                            // Authorization header is already set in defaultHeader, but we set it again to ensure it's present
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
                                                // Create WebClientResponseException to be caught by the proper catch block
                                                // Use the response body as bytes for the exception
                                                byte[] responseBodyBytes = errorBody.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                                                HttpStatus httpStatus = HttpStatus.resolve(clientResponse.statusCode().value());
                                                String reasonPhrase = httpStatus != null ? httpStatus.getReasonPhrase() : "Unknown Status";
                                                return reactor.core.publisher.Mono.error(
                                                        new WebClientResponseException(
                                                                clientResponse.statusCode().value(),
                                                                reasonPhrase,
                                                                clientResponse.headers().asHttpHeaders(),
                                                                responseBodyBytes,
                                                                java.nio.charset.StandardCharsets.UTF_8
                                                        )
                                                );
                                            });
                                }
                            )
                            .bodyToMono(AfricasTalkingResponse.class)
                            .timeout(java.time.Duration.ofSeconds(30)) // 30 second timeout
                            .block();
                    
                    // If we got here, the request succeeded
                    break;
                    
                } catch (WebClientResponseException e) {
                    // HTTP errors - don't retry 4xx errors (client errors), but retry 5xx errors (server errors)
                    // This must be caught BEFORE RuntimeException since it extends RuntimeException
                    if (e.getStatusCode().is5xxServerError() && retryCount < maxRetries) {
                        retryCount++;
                        log.warn("SMS server error {} (attempt {}/{}). Retrying in {}ms...", 
                                e.getStatusCode(), retryCount, maxRetries, retryDelayMs);
                        try {
                            Thread.sleep(retryDelayMs);
                            retryDelayMs *= 2; // Exponential backoff
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("SMS retry interrupted", ie);
                        }
                    } else {
                        // 4xx errors or max retries reached - don't retry
                        throw e;
                    }
                } catch (org.springframework.web.reactive.function.client.WebClientRequestException e) {
                    // Network errors - retry
                    // This must be caught BEFORE RuntimeException since it extends RuntimeException
                    retryCount++;
                    if (retryCount < maxRetries) {
                        log.warn("SMS network error (attempt {}/{}): {}. Retrying in {}ms...", 
                                retryCount, maxRetries, e.getMessage(), retryDelayMs);
                        try {
                            Thread.sleep(retryDelayMs);
                            retryDelayMs *= 2; // Exponential backoff
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("SMS retry interrupted", ie);
                        }
                    } else {
                        log.error("SMS request failed after {} attempts due to network error", maxRetries);
                        throw e;
                    }
                } catch (RuntimeException e) {
                    // Check if this is a timeout exception (wrapped by reactor)
                    // Reactor's timeout throws RuntimeException with "timeout" in message or cause
                    // This must be caught AFTER WebClientRequestException and WebClientResponseException
                    // since those extend RuntimeException
                    Throwable cause = e.getCause();
                    String exceptionMessage = e.getMessage();
                    boolean isTimeout = (exceptionMessage != null && (exceptionMessage.contains("Timeout") || exceptionMessage.contains("timeout"))) ||
                                       (cause != null && cause.getMessage() != null && cause.getMessage().contains("timeout")) ||
                                       e.getClass().getSimpleName().contains("Timeout");
                    
                    if (isTimeout) {
                        retryCount++;
                        if (retryCount < maxRetries) {
                            log.warn("SMS request timeout (attempt {}/{}). Retrying in {}ms...", retryCount, maxRetries, retryDelayMs);
                            try {
                                Thread.sleep(retryDelayMs);
                                retryDelayMs *= 2; // Exponential backoff
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                throw new RuntimeException("SMS retry interrupted", ie);
                            }
                            continue; // Retry the request
                        } else {
                            log.error("SMS request failed after {} attempts due to timeout", maxRetries);
                            throw new RuntimeException("SMS gateway timeout after " + maxRetries + " attempts", e);
                        }
                    }
                    // If not a timeout, rethrow to be caught by outer catch blocks
                    throw e;
                }
            }
            
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
            
        } catch (WebClientResponseException e) {
            log.error("WebClient error while sending SMS to {}: Status {} - Body: {}", 
                    normalizedPhone, e.getStatusCode(), e.getResponseBodyAsString());
            smsLog.setStatus(SmsLog.SmsStatus.FAILED);
            String errorMsg = "Gateway failure: " + e.getStatusCode();
            if (e.getStatusCode().value() == 401) {
                errorMsg += " Unauthorized - Please verify your AfricasTalking API credentials (username and API key) in application.yml or environment variables. Current username: '" + trimmedUsername + "'";
            } else if (e.getStatusCode().value() == 403) {
                errorMsg += " Forbidden - Check your API key permissions";
            } else if (e.getStatusCode().value() == 429) {
                errorMsg += " Rate limit exceeded - Too many requests. Please try again later";
            } else if (e.getStatusCode().is5xxServerError()) {
                errorMsg += " Server error - SMS gateway is temporarily unavailable. Please try again later";
            } else {
                errorMsg += " - " + (e.getResponseBodyAsString() != null && !e.getResponseBodyAsString().isEmpty() 
                    ? e.getResponseBodyAsString().substring(0, Math.min(200, e.getResponseBodyAsString().length()))
                    : "Unknown error");
            }
            smsLog.setErrorMessage(errorMsg);
            } catch (org.springframework.web.reactive.function.client.WebClientRequestException e) {
                log.error("Network error while sending SMS to {}: {}", normalizedPhone, e.getMessage(), e);
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                String errorMsg = "Network error - Unable to connect to SMS gateway";
                String errorMessage = e.getMessage() != null ? e.getMessage() : "";
                if (errorMessage.contains("Connection refused")) {
                    errorMsg += ": Connection refused. Please check your network connection and ensure the backend can reach the internet";
                } else if (errorMessage.contains("timeout")) {
                    errorMsg += ": Connection timeout. Please try again later";
                } else if (errorMessage.contains("Failed to resolve") || errorMessage.contains("Name resolution")) {
                    errorMsg += ": DNS resolution failed. Please check your internet connection and DNS settings. The SMS gateway URL is: " + AFRICASTALKING_API_URL;
                } else if (errorMessage.contains("UnknownHostException") || errorMessage.contains("getaddrinfo")) {
                    errorMsg += ": Cannot resolve hostname. Please check your internet connection and DNS settings. The SMS gateway URL is: " + AFRICASTALKING_API_URL;
                } else {
                    errorMsg += ": " + errorMessage;
                }
                smsLog.setErrorMessage(errorMsg);
        } catch (RuntimeException e) {
            // Check if this is a timeout exception (wrapped by reactor)
            // Reactor's timeout throws RuntimeException with "timeout" in message or cause
            // This catch block must come AFTER WebClientRequestException and WebClientResponseException
            // since those extend RuntimeException
            Throwable cause = e.getCause();
            String exceptionMessage = e.getMessage();
            boolean isTimeout = (exceptionMessage != null && (exceptionMessage.contains("Timeout") || exceptionMessage.contains("timeout"))) ||
                               (cause != null && cause.getMessage() != null && cause.getMessage().contains("timeout")) ||
                               e.getClass().getSimpleName().contains("Timeout");
            
            if (isTimeout) {
                log.error("Timeout while sending SMS to {}: {}", normalizedPhone, e.getMessage());
                smsLog.setStatus(SmsLog.SmsStatus.FAILED);
                smsLog.setErrorMessage("Gateway timeout - SMS gateway did not respond in time. Please try again later");
            } else {
                // Re-throw if not a timeout - let Exception catch block handle it
                throw e;
            }
        } catch (Exception e) {
            log.error("Exception while sending SMS to {}: {}", normalizedPhone, e.getMessage(), e);
            smsLog.setStatus(SmsLog.SmsStatus.FAILED);
            String errorMsg = "Gateway failure: " + (e.getMessage() != null ? e.getMessage() : "Unknown error");
            if (errorMsg.length() > 500) {
                errorMsg = errorMsg.substring(0, 500) + "...";
            }
            smsLog.setErrorMessage(errorMsg);
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
     * Delete SMS log by ID
     */
    @Transactional
    public void deleteSmsLog(Long id) {
        if (!smsLogRepository.existsById(id)) {
            throw new RuntimeException("SMS log not found with ID: " + id);
        }
        smsLogRepository.deleteById(id);
        log.info("Deleted SMS log with ID: {}", id);
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
