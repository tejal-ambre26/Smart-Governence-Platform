package com.civicpulse.grievance_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "complaint_history")
public class ComplaintHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID historyId;

    @Column(nullable = false)
    private UUID complaintId;

    private String previousStatus;   // null for the very first "created" entry

    @Column(nullable = false)
    private String newStatus;

    private String remarks;          // e.g. "Assigned to Karthik R", "Officer inspected site"

    private LocalDateTime timestamp;

    public ComplaintHistory() {
        this.timestamp = LocalDateTime.now();
    }

    // --- Getters ---
    public UUID getHistoryId() { return historyId; }
    public UUID getComplaintId() { return complaintId; }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus() { return newStatus; }
    public String getRemarks() { return remarks; }
    public LocalDateTime getTimestamp() { return timestamp; }

    // --- Setters ---
    public void setHistoryId(UUID historyId) { this.historyId = historyId; }
    public void setComplaintId(UUID complaintId) { this.complaintId = complaintId; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
