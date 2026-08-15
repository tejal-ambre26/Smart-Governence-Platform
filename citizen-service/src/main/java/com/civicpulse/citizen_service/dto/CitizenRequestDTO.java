package com.civicpulse.citizen_service.dto;

import jakarta.validation.constraints.*;

public class CitizenRequestDTO {

    @NotBlank(message = "name is required")
    public String name;

    @NotBlank(message = "phone number is required")
    @Pattern(
        regexp = "^[6-9]\\d{9}$",
        message = "phone number must be a valid 10-digit Indian number"
    )
    public String phoneNumber;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid email address")
    public String email;

    @Pattern(
        regexp = "^\\d{4}-\\d{4}-\\d{4}$",
        message = "aadhar must be in format 1234-5678-9012"
    )
    public String aadhar;

    @NotBlank(message = "address is required")
    public String address;

    @NotBlank(message = "ward is required")
    public String ward;

    @NotBlank(message = "city is required")
    public String city;

    @NotBlank(message = "state is required")
    public String state;

    @NotBlank(message = "PIN code is required")
    @Pattern(
        regexp = "^\\d{6}$",
        message = "PIN code must be 6 digits"
    )
    public String pincode;
}
