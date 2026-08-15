package com.civicpulse.servicemanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "service_applications")
public class ServiceApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID applicationId;

    @Column(unique = true)
    private String applicationNumber;

    @NotBlank(message = "citizenId is required")
    private String citizenId;

    @NotNull(message = "serviceType is required")
    @Enumerated(EnumType.STRING)
    private ServiceType serviceType;

    @NotBlank(message = "applicantName is required")
    private String applicantName;

    @NotBlank(message = "aadhaarNumber is required")
    @Pattern(regexp = "^\\d{4}-\\d{4}-\\d{4}$", message = "Aadhaar must be in format XXXX-XXXX-XXXX")
    private String aadhaarNumber;

    private String relationship;
    
    private String applicantDateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String documentsSubmitted;

    @Column(columnDefinition = "TEXT")
    private String dynamicData;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;

    private String department;
    private String rejectionReason;
    private String officerRemarks;
    private String certificateNumber;
    private String digitallySignedBy;

    private String verifiedBy;
    private String approvedBy;
    private String digitalSignature;

    @CreationTimestamp
    private LocalDateTime appliedDate;
    private LocalDateTime verifiedDate;
    private LocalDateTime approvedDate;

    private int downloadCount = 0;

    // Revenue tracking fields
    private BigDecimal feeAmount = BigDecimal.ZERO;
    
    @Column(name = "fee_collected")
    private Boolean feeCollected = false;

    // Helper compatibility getter for React frontend using id
    public UUID getId() {
        return applicationId;
    }

    public void setId(UUID id) {
        this.applicationId = id;
    }

    public ServiceApplication() {}

    public ServiceApplication(UUID applicationId, String applicationNumber, String citizenId, ServiceType serviceType,
                              String applicantName, String aadhaarNumber, String relationship, String applicantDateOfBirth, String documentsSubmitted, String dynamicData,
                              ApplicationStatus status, String department, String rejectionReason, String officerRemarks, String certificateNumber,
                              String digitallySignedBy, String verifiedBy, String approvedBy, String digitalSignature,
                              LocalDateTime appliedDate, LocalDateTime verifiedDate, LocalDateTime approvedDate,
                              int downloadCount, BigDecimal feeAmount, boolean feeCollected) {
        this.applicationId = applicationId;
        this.applicationNumber = applicationNumber;
        this.citizenId = citizenId;
        this.serviceType = serviceType;
        this.applicantName = applicantName;
        this.aadhaarNumber = aadhaarNumber;
        this.relationship = relationship;
        this.applicantDateOfBirth = applicantDateOfBirth;
        this.documentsSubmitted = documentsSubmitted;
        this.dynamicData = dynamicData;
        this.status = status;
        this.department = department;
        this.rejectionReason = rejectionReason;
        this.officerRemarks = officerRemarks;
        this.certificateNumber = certificateNumber;
        this.digitallySignedBy = digitallySignedBy;
        this.verifiedBy = verifiedBy;
        this.approvedBy = approvedBy;
        this.digitalSignature = digitalSignature;
        this.appliedDate = appliedDate;
        this.verifiedDate = verifiedDate;
        this.approvedDate = approvedDate;
        this.downloadCount = downloadCount;
        this.feeAmount = feeAmount != null ? feeAmount : BigDecimal.ZERO;
        this.feeCollected = feeCollected;
    }

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = ApplicationStatus.SUBMITTED;
        }
        if (this.appliedDate == null) {
            this.appliedDate = LocalDateTime.now();
        }
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }

    public String getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(String citizenId) {
        this.citizenId = citizenId;
    }

    public ServiceType getServiceType() {
        return serviceType;
    }

    public void setServiceType(ServiceType serviceType) {
        this.serviceType = serviceType;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public String getAadhaarNumber() {
        return aadhaarNumber;
    }

    public void setAadhaarNumber(String aadhaarNumber) {
        this.aadhaarNumber = aadhaarNumber;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public String getApplicantDateOfBirth() {
        return applicantDateOfBirth;
    }

    public void setApplicantDateOfBirth(String applicantDateOfBirth) {
        this.applicantDateOfBirth = applicantDateOfBirth;
    }

    public String getDocumentsSubmitted() {
        return documentsSubmitted;
    }

    public void setDocumentsSubmitted(String documentsSubmitted) {
        this.documentsSubmitted = documentsSubmitted;
    }

    public String getDynamicData() {
        return dynamicData;
    }

    public void setDynamicData(String dynamicData) {
        this.dynamicData = dynamicData;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getOfficerRemarks() {
        return officerRemarks;
    }

    public void setOfficerRemarks(String officerRemarks) {
        this.officerRemarks = officerRemarks;
    }

    public String getCertificateNumber() {
        return certificateNumber;
    }

    public void setCertificateNumber(String certificateNumber) {
        this.certificateNumber = certificateNumber;
    }

    public String getDigitallySignedBy() {
        return digitallySignedBy;
    }

    public void setDigitallySignedBy(String digitallySignedBy) {
        this.digitallySignedBy = digitallySignedBy;
    }

    public String getVerifiedBy() {
        return verifiedBy;
    }

    public void setVerifiedBy(String verifiedBy) {
        this.verifiedBy = verifiedBy;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getDigitalSignature() {
        return digitalSignature;
    }

    public void setDigitalSignature(String digitalSignature) {
        this.digitalSignature = digitalSignature;
    }

    public LocalDateTime getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDateTime appliedDate) {
        this.appliedDate = appliedDate;
    }

    public LocalDateTime getVerifiedDate() {
        return verifiedDate;
    }

    public void setVerifiedDate(LocalDateTime verifiedDate) {
        this.verifiedDate = verifiedDate;
    }

    public LocalDateTime getApprovedDate() {
        return approvedDate;
    }

    public void setApprovedDate(LocalDateTime approvedDate) {
        this.approvedDate = approvedDate;
    }

    public int getDownloadCount() {
        return downloadCount;
    }

    public void setDownloadCount(int downloadCount) {
        this.downloadCount = downloadCount;
    }

    public BigDecimal getFeeAmount() {
        return feeAmount;
    }

    public void setFeeAmount(BigDecimal feeAmount) {
        this.feeAmount = feeAmount != null ? feeAmount : BigDecimal.ZERO;
    }

    public boolean isFeeCollected() {
        return Boolean.TRUE.equals(feeCollected);
    }

    public Boolean getFeeCollected() {
        return Boolean.TRUE.equals(feeCollected);
    }

    public void setFeeCollected(Boolean feeCollected) {
        this.feeCollected = feeCollected != null ? feeCollected : false;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID applicationId;
        private String applicationNumber;
        private String citizenId;
        private ServiceType serviceType;
        private String applicantName;
        private String aadhaarNumber;
        private String relationship;
        private String applicantDateOfBirth;
        private String documentsSubmitted;
        private String dynamicData;
        private ApplicationStatus status;
        private String department;
        private String rejectionReason;
        private String officerRemarks;
        private String certificateNumber;
        private String digitallySignedBy;
        private String verifiedBy;
        private String approvedBy;
        private String digitalSignature;
        private LocalDateTime appliedDate;
        private LocalDateTime verifiedDate;
        private LocalDateTime approvedDate;
        private int downloadCount = 0;
        private BigDecimal feeAmount = BigDecimal.ZERO;
        private boolean feeCollected = false;

        public Builder applicationId(UUID applicationId) { this.applicationId = applicationId; return this; }
        public Builder applicationNumber(String applicationNumber) { this.applicationNumber = applicationNumber; return this; }
        public Builder citizenId(String citizenId) { this.citizenId = citizenId; return this; }
        public Builder serviceType(ServiceType serviceType) { this.serviceType = serviceType; return this; }
        public Builder applicantName(String applicantName) { this.applicantName = applicantName; return this; }
        public Builder aadhaarNumber(String aadhaarNumber) { this.aadhaarNumber = aadhaarNumber; return this; }
        public Builder relationship(String relationship) { this.relationship = relationship; return this; }
        public Builder applicantDateOfBirth(String applicantDateOfBirth) { this.applicantDateOfBirth = applicantDateOfBirth; return this; }
        public Builder documentsSubmitted(String documentsSubmitted) { this.documentsSubmitted = documentsSubmitted; return this; }
        public Builder dynamicData(String dynamicData) { this.dynamicData = dynamicData; return this; }
        public Builder status(ApplicationStatus status) { this.status = status; return this; }
        public Builder department(String department) { this.department = department; return this; }
        public Builder rejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; return this; }
        public Builder officerRemarks(String officerRemarks) { this.officerRemarks = officerRemarks; return this; }
        public Builder certificateNumber(String certificateNumber) { this.certificateNumber = certificateNumber; return this; }
        public Builder digitallySignedBy(String digitallySignedBy) { this.digitallySignedBy = digitallySignedBy; return this; }
        public Builder verifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; return this; }
        public Builder approvedBy(String approvedBy) { this.approvedBy = approvedBy; return this; }
        public Builder digitalSignature(String digitalSignature) { this.digitalSignature = digitalSignature; return this; }
        public Builder appliedDate(LocalDateTime appliedDate) { this.appliedDate = appliedDate; return this; }
        public Builder verifiedDate(LocalDateTime verifiedDate) { this.verifiedDate = verifiedDate; return this; }
        public Builder approvedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; return this; }
        public Builder downloadCount(int downloadCount) { this.downloadCount = downloadCount; return this; }
        public Builder feeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; return this; }
        public Builder feeCollected(boolean feeCollected) { this.feeCollected = feeCollected; return this; }

        public ServiceApplication build() {
            return new ServiceApplication(applicationId, applicationNumber, citizenId, serviceType, applicantName,
                    aadhaarNumber, relationship, applicantDateOfBirth, documentsSubmitted, dynamicData, status, department, rejectionReason, officerRemarks, certificateNumber, digitallySignedBy,
                    verifiedBy, approvedBy, digitalSignature, appliedDate, verifiedDate, approvedDate, downloadCount,
                    feeAmount, feeCollected);
        }
    }
}
