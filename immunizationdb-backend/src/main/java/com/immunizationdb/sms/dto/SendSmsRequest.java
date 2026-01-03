package com.immunizationdb.sms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendSmsRequest {
    @NotBlank(message = "Phone number is required")
    private String phone;
    
    @NotBlank(message = "Message is required")
    private String message;
}

