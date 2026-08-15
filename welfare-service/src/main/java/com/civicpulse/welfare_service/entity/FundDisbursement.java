package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fund_disbursements")
public class FundDisbursement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID disbursementId;

    @NotNull(message = "beneficiaryId is required")
    private UUID beneficiaryId;

    @NotNull(message = "schemeId is required")
    private UUID schemeId;

    @NotNull(message = "amount is required")
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Column(unique = true)
    private String transactionId;

    private LocalDateTime disbursedDate;
    private String approvedBy;

    @PrePersist
    public void prePersist() {
        if (this.paymentStatus == null) this.paymentStatus = PaymentStatus.PENDING;
        if (this.disbursedDate == null) this.disbursedDate = LocalDateTime.now();
    }

    public FundDisbursement() {}

    public UUID getDisbursementId() { return disbursementId; }
    public void setDisbursementId(UUID disbursementId) { this.disbursementId = disbursementId; }

    public UUID getBeneficiaryId() { return beneficiaryId; }
    public void setBeneficiaryId(UUID beneficiaryId) { this.beneficiaryId = beneficiaryId; }

    public UUID getSchemeId() { return schemeId; }
    public void setSchemeId(UUID schemeId) { this.schemeId = schemeId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public LocalDateTime getDisbursedDate() { return disbursedDate; }
    public void setDisbursedDate(LocalDateTime disbursedDate) { this.disbursedDate = disbursedDate; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
}
