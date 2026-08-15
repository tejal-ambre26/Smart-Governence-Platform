package com.civicpulse.citizen_service.entity;

import java.util.UUID;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import org.springframework.data.domain.Persistable;

@Entity
@Table(name = "citizens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Citizen implements Persistable<UUID> {

    @Id
    public UUID citizenId;

    @Transient
    @Builder.Default
    private boolean isNewFlag = true;

    @Override
    public UUID getId() {
        return this.citizenId;
    }

    @Override
    public boolean isNew() {
        return this.isNewFlag;
    }

    @PostPersist
    @PostLoad
    protected void markNotNew() {
        this.isNewFlag = false;
    }

    @PrePersist
    protected void ensureId() {
        if (this.citizenId == null) {
            this.citizenId = java.util.UUID.randomUUID();
        }
    }

    @NotBlank(message = "name is required")
    @Column(nullable = false)
    public String name;

    @NotBlank(message = "phone number is required")
    @Pattern(
        regexp = "^[6-9]\\d{9}$",
        message = "phone number must be a valid 10-digit Indian number"
    )
    @Column(nullable = false, unique = true)
    public String phoneNumber;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid email address")
    @Column(nullable = false, unique = true)
    public String email;

    // Optional Aadhar
    @Pattern(
        regexp = "^\\d{4}-\\d{4}-\\d{4}$",
        message = "aadhar must be in format 1234-5678-9012"
    )
    @Column(unique = true)
    public String aadhar;

    @NotBlank(message = "address is required")
    @Column(nullable = false)
    public String address;

    @NotBlank(message = "ward is required")
    @Column(nullable = false)
    public String ward;

    @NotBlank(message = "city is required")
    @Column(nullable = false)
    public String city;

    @NotBlank(message = "state is required")
    @Column(nullable = false)
    public String state;

    @NotBlank(message = "PIN code is required")
    @Pattern(
        regexp = "^\\d{6}$",
        message = "PIN code must be 6 digits"
    )
    @Column(nullable = false)
    public String pincode;

    // Password will be added later when implementing Login/Authentication
}