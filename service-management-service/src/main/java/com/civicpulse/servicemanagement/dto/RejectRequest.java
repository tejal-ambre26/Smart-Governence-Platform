package com.civicpulse.servicemanagement.dto;

public class RejectRequest {
    private String reason;
    private String officerRemarks;

    public RejectRequest() {}

    public RejectRequest(String reason, String officerRemarks) {
        this.reason = reason;
        this.officerRemarks = officerRemarks;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getOfficerRemarks() { return officerRemarks; }
    public void setOfficerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; }
}
