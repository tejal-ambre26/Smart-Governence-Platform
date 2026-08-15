package com.civicpulse.grievance_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID departmentId;

    @NotBlank(message = "department name is required")
    @Column(nullable = false, unique = true)
    private String name;   // e.g. "Water", "Road", "Electricity", "Sanitation"

    private String headOfficerName;
    private String contactEmail;
    private String contactPhone;

    public Department() {}

    // --- Getters ---
    public UUID getDepartmentId() { return departmentId; }
    public String getName() { return name; }
    public String getHeadOfficerName() { return headOfficerName; }
    public String getContactEmail() { return contactEmail; }
    public String getContactPhone() { return contactPhone; }

    // --- Setters ---
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public void setName(String name) { this.name = name; }
    public void setHeadOfficerName(String headOfficerName) { this.headOfficerName = headOfficerName; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
}
