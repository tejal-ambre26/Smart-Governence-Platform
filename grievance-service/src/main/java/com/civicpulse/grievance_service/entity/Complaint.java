package com.civicpulse.grievance_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID complaintId;

    // Storing citizenId as a String reference (microservices pattern — no cross-DB joins)
    @NotBlank(message = "citizenId is required")
    @Column(nullable = false)
    private String citizenId;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "description is required")
    @Column(length = 2000)
    private String description;

    @NotBlank(message = "department is required")
    private String department;

    @NotBlank(message = "location is required")
    private String location;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    // Numeric ordering: HIGH=1, MEDIUM=2, LOW=3 — enables DB-level ORDER BY
    private Integer priorityOrder;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status;

    private String assignedOfficer;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime slaDeadline;

    // Escalation tracking
    private Boolean escalated = false;
    private Integer escalationLevel = 0;  // 0 = not escalated, 1 = Level 1, 2 = Level 2, etc.

    @Column(columnDefinition = "TEXT")
    private String attachmentUrl;

    // JPA requires a no-arg constructor
    public Complaint() {}

    // Set default values before first persist
    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.status == null)    this.status = ComplaintStatus.NEW;
        if (this.priority == null)  this.priority = Priority.MEDIUM;
        if (this.escalated == null) this.escalated = false;
        if (this.escalationLevel == null) this.escalationLevel = 0;
        syncPriorityOrder();
    }

    @PreUpdate
    public void preUpdate() {
        syncPriorityOrder();
    }

    private void syncPriorityOrder() {
        if (this.priority == Priority.HIGH)   this.priorityOrder = 1;
        else if (this.priority == Priority.LOW)  this.priorityOrder = 3;
        else                                      this.priorityOrder = 2; // MEDIUM default
    }

    // ----------------------------------------------------------------
    // SLA STATUS — @Transient means it's computed on-the-fly, not stored.
    // Jackson automatically includes any public getXxx() in JSON responses.
    // ----------------------------------------------------------------
    public enum SlaStatus {
        ON_TIME,        // green  — plenty of time left
        NEAR_DEADLINE,  // yellow — less than 20% of SLA window remaining
        OVERDUE         // red    — deadline has passed
    }

    @Transient
    public SlaStatus getSlaStatus() {
        // Already closed/resolved — no active SLA warning needed
        if (this.status == ComplaintStatus.RESOLVED || this.status == ComplaintStatus.CLOSED) {
            return SlaStatus.ON_TIME;
        }

        if (this.slaDeadline == null || this.createdAt == null) {
            return SlaStatus.ON_TIME;
        }

        LocalDateTime now = LocalDateTime.now();

        if (now.isAfter(this.slaDeadline)) {
            return SlaStatus.OVERDUE;
        }

        long totalMinutes   = Duration.between(this.createdAt, this.slaDeadline).toMinutes();
        long remainingMinutes = Duration.between(now, this.slaDeadline).toMinutes();

        if (totalMinutes <= 0) return SlaStatus.ON_TIME;

        double percentRemaining = (double) remainingMinutes / totalMinutes;
        return percentRemaining <= 0.20 ? SlaStatus.NEAR_DEADLINE : SlaStatus.ON_TIME;
    }

    // ----------------------------------------------------------------
    // Getters
    // ----------------------------------------------------------------
    public UUID getComplaintId()        { return complaintId; }
    public String getCitizenId()        { return citizenId; }
    public String getTitle()            { return title; }
    public String getDescription()      { return description; }
    public String getDepartment()       { return department; }
    public String getLocation()         { return location; }
    public Priority getPriority()       { return priority; }
    public ComplaintStatus getStatus()  { return status; }
    public String getAssignedOfficer()  { return assignedOfficer; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getSlaDeadline(){ return slaDeadline; }
    public Boolean isEscalated()        { return escalated; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public Integer getPriorityOrder()   { return priorityOrder; }
    public String getAttachmentUrl()    { return attachmentUrl; }

    // ----------------------------------------------------------------
    // Setters
    // ----------------------------------------------------------------
    public void setComplaintId(UUID complaintId)            { this.complaintId = complaintId; }
    public void setCitizenId(String citizenId)              { this.citizenId = citizenId; }
    public void setTitle(String title)                      { this.title = title; }
    public void setDescription(String description)          { this.description = description; }
    public void setDepartment(String department)            { this.department = department; }
    public void setLocation(String location)                { this.location = location; }
    public void setPriority(Priority priority)              { this.priority = priority; syncPriorityOrder(); }
    public void setStatus(ComplaintStatus status)           { this.status = status; }
    public void setAssignedOfficer(String assignedOfficer)  { this.assignedOfficer = assignedOfficer; }
    public void setCreatedAt(LocalDateTime createdAt)       { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)       { this.updatedAt = updatedAt; }
    public void setSlaDeadline(LocalDateTime slaDeadline)   { this.slaDeadline = slaDeadline; }
    public void setEscalated(Boolean escalated)             { this.escalated = escalated; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public void setAttachmentUrl(String attachmentUrl)      { this.attachmentUrl = attachmentUrl; }

    // ----------------------------------------------------------------
    // Enums
    // ----------------------------------------------------------------
    public enum Priority {
        HIGH, MEDIUM, LOW
    }

    public enum ComplaintStatus {
        NEW, ASSIGNED, IN_PROGRESS, PENDING, RESOLVED, CLOSED
    }
}