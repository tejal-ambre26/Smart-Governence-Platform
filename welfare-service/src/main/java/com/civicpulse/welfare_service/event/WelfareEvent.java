package com.civicpulse.welfare_service.event;

import java.time.LocalDateTime;
import java.util.UUID;

public class WelfareEvent {
    private String eventType;
    private UUID beneficiaryId;
    private String beneficiaryCode;
    private String citizenId;
    private String applicantName;
    private UUID schemeId;
    private String schemeName;
    private String status;
    private String remarks;
    private String transactionId;
    private String department;
    private LocalDateTime timestamp;

    public WelfareEvent() {}

    public WelfareEvent(String eventType, UUID beneficiaryId, String beneficiaryCode,
                        String citizenId, String applicantName, UUID schemeId,
                        String schemeName, String status, String remarks, String transactionId, String department) {
        this.eventType = eventType;
        this.beneficiaryId = beneficiaryId;
        this.beneficiaryCode = beneficiaryCode;
        this.citizenId = citizenId;
        this.applicantName = applicantName;
        this.schemeId = schemeId;
        this.schemeName = schemeName;
        this.status = status;
        this.remarks = remarks;
        this.transactionId = transactionId;
        this.department = department;
        this.timestamp = LocalDateTime.now();
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getBeneficiaryId() { return beneficiaryId; }
    public void setBeneficiaryId(UUID beneficiaryId) { this.beneficiaryId = beneficiaryId; }

    public String getBeneficiaryCode() { return beneficiaryCode; }
    public void setBeneficiaryCode(String beneficiaryCode) { this.beneficiaryCode = beneficiaryCode; }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public UUID getSchemeId() { return schemeId; }
    public void setSchemeId(UUID schemeId) { this.schemeId = schemeId; }

    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String schemeName) { this.schemeName = schemeName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
