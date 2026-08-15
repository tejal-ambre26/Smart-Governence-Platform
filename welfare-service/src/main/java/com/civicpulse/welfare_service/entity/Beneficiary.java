package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "beneficiaries")
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID beneficiaryId;

    @Column(unique = true)
    private String beneficiaryCode;

    @NotBlank(message = "citizenId is required")
    private String citizenId;

    @NotNull(message = "schemeId is required")
    private UUID schemeId;

    @NotBlank(message = "applicantName is required")
    private String applicantName;

    private String applicantAadhaar;

    private BigDecimal annualIncome;
    private Integer age;

    @Column(columnDefinition = "TEXT")
    private String familyStatus;

    // ── Dedicated Bank Details Fields ───────────────────────────────────────
    private String accountHolderName;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private Boolean bankVerified = false;
    private String verifiedByOfficer;

    // ── Uploaded Document Reference Fields ──────────────────────────────────
    private String aadhaarDocument;
    private String incomeCertificate;
    private String bankPassbook;
    private String addressProof;
    private String photograph;

    @Column(columnDefinition = "TEXT")
    private String documentsSubmitted;

    @Enumerated(EnumType.STRING)
    private EligibilityStatus eligibilityStatus;

    @Enumerated(EnumType.STRING)
    private BeneficiaryStatus status;

    private String assignedDepartment;
    private String assignedOfficer;

    private String recommendationStatus;
    
    @Column(columnDefinition = "TEXT")
    private String recommendationRemarks;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private String adminDecision;
    private String fundTransferStatus;

    // ── Processing Officer & DBT Fields ────────────────────────────────────
    private LocalDateTime verificationStartedAt;
    private LocalDateTime expectedCompletionDate;
    private String transactionId;
    private String paymentReference;
    private BigDecimal disbursedAmount;

    private LocalDateTime appliedDate;
    private LocalDateTime approvedDate;

    @PrePersist
    public void prePersist() {
        if (this.status == null) this.status = BeneficiaryStatus.DRAFT;
        if (this.eligibilityStatus == null) this.eligibilityStatus = EligibilityStatus.PENDING_CHECK;
        if (this.appliedDate == null) this.appliedDate = LocalDateTime.now();
        if (this.bankVerified == null) this.bankVerified = false;
    }

    public Beneficiary() {}

    public UUID getBeneficiaryId() { return beneficiaryId; }
    public void setBeneficiaryId(UUID beneficiaryId) { this.beneficiaryId = beneficiaryId; }

    public String getBeneficiaryCode() { return beneficiaryCode; }
    public void setBeneficiaryCode(String beneficiaryCode) { this.beneficiaryCode = beneficiaryCode; }

    public String getCitizenId() { return citizenId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }

    public UUID getSchemeId() { return schemeId; }
    public void setSchemeId(UUID schemeId) { this.schemeId = schemeId; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantAadhaar() { return applicantAadhaar; }
    public void setApplicantAadhaar(String applicantAadhaar) { this.applicantAadhaar = applicantAadhaar; }

    public BigDecimal getAnnualIncome() { return annualIncome; }
    public void setAnnualIncome(BigDecimal annualIncome) { this.annualIncome = annualIncome; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getFamilyStatus() { return familyStatus; }
    public void setFamilyStatus(String familyStatus) { this.familyStatus = familyStatus; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Boolean getBankVerified() { return bankVerified; }
    public void setBankVerified(Boolean bankVerified) { this.bankVerified = bankVerified; }

    public String getVerifiedByOfficer() { return verifiedByOfficer; }
    public void setVerifiedByOfficer(String verifiedByOfficer) { this.verifiedByOfficer = verifiedByOfficer; }

    public String getAadhaarDocument() { return aadhaarDocument; }
    public void setAadhaarDocument(String aadhaarDocument) { this.aadhaarDocument = aadhaarDocument; }

    public String getIncomeCertificate() { return incomeCertificate; }
    public void setIncomeCertificate(String incomeCertificate) { this.incomeCertificate = incomeCertificate; }

    public String getBankPassbook() { return bankPassbook; }
    public void setBankPassbook(String bankPassbook) { this.bankPassbook = bankPassbook; }

    public String getAddressProof() { return addressProof; }
    public void setAddressProof(String addressProof) { this.addressProof = addressProof; }

    public String getPhotograph() { return photograph; }
    public void setPhotograph(String photograph) { this.photograph = photograph; }

    public String getDocumentsSubmitted() { return documentsSubmitted; }
    public void setDocumentsSubmitted(String documentsSubmitted) { this.documentsSubmitted = documentsSubmitted; }

    public EligibilityStatus getEligibilityStatus() { return eligibilityStatus; }
    public void setEligibilityStatus(EligibilityStatus eligibilityStatus) { this.eligibilityStatus = eligibilityStatus; }

    public BeneficiaryStatus getStatus() { return status; }
    public void setStatus(BeneficiaryStatus status) { this.status = status; }

    public String getAssignedDepartment() { return assignedDepartment; }
    public void setAssignedDepartment(String assignedDepartment) { this.assignedDepartment = assignedDepartment; }

    public String getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(String assignedOfficer) { this.assignedOfficer = assignedOfficer; }

    public String getRecommendationStatus() { return recommendationStatus; }
    public void setRecommendationStatus(String recommendationStatus) { this.recommendationStatus = recommendationStatus; }

    public String getRecommendationRemarks() { return recommendationRemarks; }
    public void setRecommendationRemarks(String recommendationRemarks) { this.recommendationRemarks = recommendationRemarks; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getAdminDecision() { return adminDecision; }
    public void setAdminDecision(String adminDecision) { this.adminDecision = adminDecision; }

    public String getFundTransferStatus() { return fundTransferStatus; }
    public void setFundTransferStatus(String fundTransferStatus) { this.fundTransferStatus = fundTransferStatus; }

    public LocalDateTime getVerificationStartedAt() { return verificationStartedAt; }
    public void setVerificationStartedAt(LocalDateTime verificationStartedAt) { this.verificationStartedAt = verificationStartedAt; }

    public LocalDateTime getExpectedCompletionDate() { return expectedCompletionDate; }
    public void setExpectedCompletionDate(LocalDateTime expectedCompletionDate) { this.expectedCompletionDate = expectedCompletionDate; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public BigDecimal getDisbursedAmount() { return disbursedAmount; }
    public void setDisbursedAmount(BigDecimal disbursedAmount) { this.disbursedAmount = disbursedAmount; }

    public LocalDateTime getAppliedDate() { return appliedDate; }
    public void setAppliedDate(LocalDateTime appliedDate) { this.appliedDate = appliedDate; }

    public LocalDateTime getApprovedDate() { return approvedDate; }
    public void setApprovedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; }
}
