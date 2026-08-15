package com.civicpulse.citizen_service.dto;

import jakarta.validation.constraints.*;

public class PublicRegisterDTO {

    @NotBlank(message = "Full name is required")
    public String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    public String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Must be a valid 10-digit Indian phone number")
    public String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    public String password;

    @Pattern(regexp = "^\\d{4}-\\d{4}-\\d{4}$", message = "Aadhaar must be in format 1234-5678-9012")
    public String aadhar;

    @NotBlank(message = "Address is required")
    public String address;

    @NotBlank(message = "Ward is required")
    public String ward;

    @NotBlank(message = "City is required")
    public String city;

    public String state = "India";

    @NotBlank(message = "PIN code is required")
    @Pattern(regexp = "^\\d{6}$", message = "PIN code must be 6 digits")
    public String pincode;
}
