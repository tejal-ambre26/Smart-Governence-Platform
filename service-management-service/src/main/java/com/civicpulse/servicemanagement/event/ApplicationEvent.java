package com.civicpulse.servicemanagement.event;

import java.time.LocalDateTime;
import java.util.UUID;

public class ApplicationEvent {
    private String eventType;
    private UUID applicationId;
    private String applicationNumber;
    private String citizenId;
    private String serviceType;
    private String applicantName;
    private String status;
    private String department;
    private String remarks;
    private LocalDateTime timestamp;

    public ApplicationEvent() {}

    public ApplicationEvent(String eventType, UUID applicationId, String applicationNumber, String citizenId,
                            String serviceType, String applicantName, String status, String department, String remarks,
                            LocalDateTime timestamp) {
        this.eventType = eventType;
        this.applicationId = applicationId;
        this.applicationNumber = applicationNumber;
        this.citizenId = citizenId;
        this.serviceType = serviceType;
        this.applicantName = applicantName;
        this.status = status;
        this.department = department;
        this.remarks = remarks;
        this.timestamp = timestamp;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getApplicationId() { return applicationId; }
    public void setApplicationId(UUID applicationId) { this.applicationId = applicationId; }

    public String getApplicationNumber() { return applicationNumber; }
    public void setApplicationNumber(String applicationNumber) { this.applicationNumber = applicationNumber; }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
