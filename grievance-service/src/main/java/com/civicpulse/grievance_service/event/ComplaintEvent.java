package com.civicpulse.grievance_service.event;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kafka event published to complaint-related topics:
 *   - "complaint-created"        (eventType = CREATED)
 *   - "complaint-status-changed" (eventType = STATUS_CHANGED)
 *   - "complaint-escalated"      (eventType = ESCALATED)
 *
 * Note: Written as a plain POJO (no Lombok) for Java 25 compatibility.
 */
public class ComplaintEvent {
    /** CREATED | STATUS_CHANGED | ESCALATED */
    private String eventType;
    private UUID complaintId;
    private String citizenId;
    private String department;
    private String oldStatus;
    private String newStatus;
    private String assignedOfficer;
    private String remarks;
    private LocalDateTime timestamp;

    /** Required by Jackson for deserialization */
    public ComplaintEvent() {}

    public ComplaintEvent(String eventType, UUID complaintId, String citizenId,
                          String department, String oldStatus, String newStatus,
                          String assignedOfficer, String remarks, LocalDateTime timestamp) {
        this.eventType = eventType;
        this.complaintId = complaintId;
        this.citizenId = citizenId;
        this.department = department;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.assignedOfficer = assignedOfficer;
        this.remarks = remarks;
        this.timestamp = timestamp;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getComplaintId() { return complaintId; }
    public void setComplaintId(UUID complaintId) { this.complaintId = complaintId; }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(String assignedOfficer) { this.assignedOfficer = assignedOfficer; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
