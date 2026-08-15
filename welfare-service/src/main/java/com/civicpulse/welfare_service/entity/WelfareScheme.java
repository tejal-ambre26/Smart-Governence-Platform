package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "welfare_schemes")
public class WelfareScheme {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID schemeId;

    @NotBlank(message = "schemeName is required")
    @Column(unique = true)
    private String schemeName;

    @NotBlank(message = "department is required")
    private String department;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String eligibilityCriteria;

    private BigDecimal minIncome;
    private BigDecimal maxIncome;
    private Integer minAge;
    private Integer maxAge;

    private BigDecimal benefitAmount;

    @NotNull(message = "budgetAllocated is required")
    private BigDecimal budgetAllocated;

    private BigDecimal budgetSpent;
    private int beneficiaryCount;

    @Enumerated(EnumType.STRING)
    private SchemeStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.status == null) this.status = SchemeStatus.ACTIVE;
        if (this.budgetSpent == null) this.budgetSpent = BigDecimal.ZERO;
        if (this.benefitAmount == null) this.benefitAmount = new BigDecimal("25000.00");
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public WelfareScheme() {}

    public UUID getSchemeId() { return schemeId; }
    public void setSchemeId(UUID schemeId) { this.schemeId = schemeId; }

    public String getSchemeName() { return schemeName; }
    public void setSchemeName(String schemeName) { this.schemeName = schemeName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEligibilityCriteria() { return eligibilityCriteria; }
    public void setEligibilityCriteria(String eligibilityCriteria) { this.eligibilityCriteria = eligibilityCriteria; }

    public BigDecimal getMinIncome() { return minIncome; }
    public void setMinIncome(BigDecimal minIncome) { this.minIncome = minIncome; }

    public BigDecimal getMaxIncome() { return maxIncome; }
    public void setMaxIncome(BigDecimal maxIncome) { this.maxIncome = maxIncome; }

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public BigDecimal getBenefitAmount() { return benefitAmount; }
    public void setBenefitAmount(BigDecimal benefitAmount) { this.benefitAmount = benefitAmount; }

    public BigDecimal getBudgetAllocated() { return budgetAllocated; }
    public void setBudgetAllocated(BigDecimal budgetAllocated) { this.budgetAllocated = budgetAllocated; }

    public BigDecimal getBudgetSpent() { return budgetSpent; }
    public void setBudgetSpent(BigDecimal budgetSpent) { this.budgetSpent = budgetSpent; }

    public int getBeneficiaryCount() { return beneficiaryCount; }
    public void setBeneficiaryCount(int beneficiaryCount) { this.beneficiaryCount = beneficiaryCount; }

    public SchemeStatus getStatus() { return status; }
    public void setStatus(SchemeStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
