package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID expenseId;

    private String department;
    private UUID schemeId;
    private UUID beneficiaryId;

    @Column(precision = 14, scale = 2)
    private BigDecimal amount;

    private String description;
    private String status; // APPROVED, DISBURSED, COMPLETED
    private LocalDateTime approvalDate;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Expense() {}

    public Expense(String department, UUID schemeId, UUID beneficiaryId, BigDecimal amount, String description, String status) {
        this.department = department;
        this.schemeId = schemeId;
        this.beneficiaryId = beneficiaryId;
        this.amount = amount;
        this.description = description;
        this.status = status;
        this.approvalDate = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public UUID getExpenseId() { return expenseId; }
    public void setExpenseId(UUID expenseId) { this.expenseId = expenseId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public UUID getSchemeId() { return schemeId; }
    public void setSchemeId(UUID schemeId) { this.schemeId = schemeId; }

    public UUID getBeneficiaryId() { return beneficiaryId; }
    public void setBeneficiaryId(UUID beneficiaryId) { this.beneficiaryId = beneficiaryId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDateTime approvalDate) { this.approvalDate = approvalDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
