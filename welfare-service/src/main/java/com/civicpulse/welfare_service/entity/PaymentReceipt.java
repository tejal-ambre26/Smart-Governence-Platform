package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_receipts")
public class PaymentReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID receiptId;

    @Column(unique = true, nullable = false)
    private String receiptNumber;

    private String transactionId;
    private UUID beneficiaryId;

    @Column(precision = 14, scale = 2)
    private BigDecimal amount;

    private String schemeName;
    private String citizenName;
    private LocalDateTime generatedAt = LocalDateTime.now();

    public PaymentReceipt() {}

    public PaymentReceipt(String receiptNumber, String transactionId, UUID beneficiaryId, BigDecimal amount, String schemeName, String citizenName) {
        this.receiptNumber = receiptNumber;
        this.transactionId = transactionId;
        this.beneficiaryId = beneficiaryId;
        this.amount = amount;
        this.schemeName = schemeName;
        this.citizenName = citizenName;
        this.generatedAt = LocalDateTime.now();
    }

    public UUID getReceiptId() { return receiptId; }
    public void setReceiptId(UUID receiptId) { this.receiptId = receiptId; }

    public String getReceiptNumber() { return receiptNumber; }
    public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public UUID getBeneficiaryId() { return beneficiaryId; }
    public void setBeneficiaryId(UUID beneficiaryId) { this.beneficiaryId = beneficiaryId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String schemeName) { this.schemeName = schemeName; }

    public String getCitizenName() { return citizenName; }
    public void setCitizenName(String citizenName) { this.citizenName = citizenName; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
