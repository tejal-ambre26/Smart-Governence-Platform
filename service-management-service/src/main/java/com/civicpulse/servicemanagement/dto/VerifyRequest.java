package com.civicpulse.servicemanagement.dto;

public class VerifyRequest {
    private boolean verified;
    private String remarks;

    public VerifyRequest() {}

    public VerifyRequest(boolean verified, String remarks) {
        this.verified = verified;
        this.remarks = remarks;
    }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
