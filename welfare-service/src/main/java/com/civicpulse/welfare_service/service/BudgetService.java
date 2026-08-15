package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.entity.Budget;
import com.civicpulse.welfare_service.repository.BudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepo;

    public BudgetService(BudgetRepository budgetRepo) {
        this.budgetRepo = budgetRepo;
    }

    public Budget create(Budget budget) {
        return budgetRepo.save(budget);
    }

    public List<Budget> getAll() {
        return budgetRepo.findAll();
    }

    public Budget getById(UUID id) {
        return budgetRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Budget not found: " + id));
    }

    @Transactional
    public Budget adjustAllocation(UUID id, BigDecimal newAllocated) {
        Budget budget = getById(id);
        budget.setTotalAllocated(newAllocated);
        return budgetRepo.save(budget);
    }

    public List<Budget> getAlerts() {
        return budgetRepo.findAll().stream()
                .filter(b -> b.getUtilizationPercent().doubleValue() >= b.getAlertThresholdPercent())
                .collect(Collectors.toList());
    }

    // Called internally after a disbursement
    @Transactional
    public void incrementSpent(String department, String fiscalYear, BigDecimal amount) {
        List<Budget> budgets = budgetRepo.findByDepartment(department).stream()
                .filter(b -> fiscalYear == null || b.getFiscalYear().equals(fiscalYear))
                .toList();
        for (Budget b : budgets) {
            BigDecimal newSpent = (b.getTotalSpent() != null ? b.getTotalSpent() : BigDecimal.ZERO).add(amount);
            b.setTotalSpent(newSpent);
            budgetRepo.save(b);
        }
    }
}
