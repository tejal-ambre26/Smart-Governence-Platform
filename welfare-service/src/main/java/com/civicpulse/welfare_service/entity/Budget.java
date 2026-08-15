package com.civicpulse.welfare_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "budgets")
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID budgetId;

    @NotBlank(message = "department is required")
    private String department;

    @NotBlank(message = "fiscalYear is required")
    private String fiscalYear;

    @NotNull(message = "totalAllocated is required")
    private BigDecimal totalAllocated;

    private BigDecimal totalSpent;

    private int alertThresholdPercent;

    private LocalDateTime createdAt;

    @Transient
    public BigDecimal getRemainingBudget() {
        if (totalAllocated == null) return BigDecimal.ZERO;
        BigDecimal spent = totalSpent != null ? totalSpent : BigDecimal.ZERO;
        return totalAllocated.subtract(spent);
    }

    @Transient
    public BigDecimal getUtilizationPercent() {
        if (totalAllocated == null || totalAllocated.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
        BigDecimal spent = totalSpent != null ? totalSpent : BigDecimal.ZERO;
        return spent.multiply(BigDecimal.valueOf(100))
                .divide(totalAllocated, 2, RoundingMode.HALF_UP);
    }

    @PrePersist
    public void prePersist() {
        if (this.totalSpent == null) this.totalSpent = BigDecimal.ZERO;
        if (this.alertThresholdPercent == 0) this.alertThresholdPercent = 85;
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public Budget() {}

    public UUID getBudgetId() { return budgetId; }
    public void setBudgetId(UUID budgetId) { this.budgetId = budgetId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(String fiscalYear) { this.fiscalYear = fiscalYear; }

    public BigDecimal getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(BigDecimal totalAllocated) { this.totalAllocated = totalAllocated; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public int getAlertThresholdPercent() { return alertThresholdPercent; }
    public void setAlertThresholdPercent(int alertThresholdPercent) { this.alertThresholdPercent = alertThresholdPercent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
