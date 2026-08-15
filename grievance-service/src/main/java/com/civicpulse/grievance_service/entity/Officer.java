package com.civicpulse.grievance_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Entity
@Table(name = "officers")
public class Officer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID officerId;

    @NotBlank(message = "officer name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "department is required")
    private String department;   // which department this officer belongs to

    private String email;
    private String phoneNumber;

    // false = junior officer, true = senior (used later for escalation)
    private boolean seniorOfficer = false;

    public Officer() {}

    // --- Getters ---
    public UUID getOfficerId() { return officerId; }
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public boolean isSeniorOfficer() { return seniorOfficer; }

    // --- Setters ---
    public void setOfficerId(UUID officerId) { this.officerId = officerId; }
    public void setName(String name) { this.name = name; }
    public void setDepartment(String department) { this.department = department; }
    public void setEmail(String email) { this.email = email; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setSeniorOfficer(boolean seniorOfficer) { this.seniorOfficer = seniorOfficer; }
}
