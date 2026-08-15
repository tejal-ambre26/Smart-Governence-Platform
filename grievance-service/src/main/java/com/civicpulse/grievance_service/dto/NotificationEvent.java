package com.civicpulse.grievance_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class NotificationEvent {
    private UUID complaintId;
    private String citizenId;
    private String assignedOfficer;
    private String eventType;
    private String message;
    private String recipient;
    private LocalDateTime timestamp;

    public NotificationEvent() {}

    public NotificationEvent(UUID complaintId, String citizenId, String assignedOfficer, 
                             String eventType, String message, String recipient, LocalDateTime timestamp) {
        this.complaintId = complaintId;
        this.citizenId = citizenId;
        this.assignedOfficer = assignedOfficer;
        this.eventType = eventType;
        this.message = message;
        this.recipient = recipient;
        this.timestamp = timestamp;
    }

    public UUID getComplaintId() { return complaintId; }
    public void setComplaintId(UUID complaintId) { this.complaintId = complaintId; }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public String getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(String assignedOfficer) { this.assignedOfficer = assignedOfficer; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
