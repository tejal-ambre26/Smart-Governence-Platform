package com.civicpulse.servicemanagement.dto;

public class AdminStatsResponse {
    private long totalApplications;
    private long pending;
    private long underVerification;
    private long approved;
    private long rejected;
    private long certificatesIssued;
    private long downloaded;

    public AdminStatsResponse() {}

    public AdminStatsResponse(long totalApplications, long pending, long underVerification,
                              long approved, long rejected, long certificatesIssued, long downloaded) {
        this.totalApplications = totalApplications;
        this.pending = pending;
        this.underVerification = underVerification;
        this.approved = approved;
        this.rejected = rejected;
        this.certificatesIssued = certificatesIssued;
        this.downloaded = downloaded;
    }

    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }

    public long getPending() { return pending; }
    public void setPending(long pending) { this.pending = pending; }

    public long getUnderVerification() { return underVerification; }
    public void setUnderVerification(long underVerification) { this.underVerification = underVerification; }

    public long getApproved() { return approved; }
    public void setApproved(long approved) { this.approved = approved; }

    public long getRejected() { return rejected; }
    public void setRejected(long rejected) { this.rejected = rejected; }

    public long getCertificatesIssued() { return certificatesIssued; }
    public void setCertificatesIssued(long certificatesIssued) { this.certificatesIssued = certificatesIssued; }

    public long getDownloaded() { return downloaded; }
    public void setDownloaded(long downloaded) { this.downloaded = downloaded; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private long totalApplications;
        private long pending;
        private long underVerification;
        private long approved;
        private long rejected;
        private long certificatesIssued;
        private long downloaded;

        public Builder totalApplications(long totalApplications) { this.totalApplications = totalApplications; return this; }
        public Builder pending(long pending) { this.pending = pending; return this; }
        public Builder underVerification(long underVerification) { this.underVerification = underVerification; return this; }
        public Builder approved(long approved) { this.approved = approved; return this; }
        public Builder rejected(long rejected) { this.rejected = rejected; return this; }
        public Builder certificatesIssued(long certificatesIssued) { this.certificatesIssued = certificatesIssued; return this; }
        public Builder downloaded(long downloaded) { this.downloaded = downloaded; return this; }

        public AdminStatsResponse build() {
            return new AdminStatsResponse(totalApplications, pending, underVerification, approved, rejected, certificatesIssued, downloaded);
        }
    }
}
