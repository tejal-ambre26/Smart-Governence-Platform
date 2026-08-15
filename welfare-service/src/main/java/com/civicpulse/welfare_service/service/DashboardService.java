package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.entity.BeneficiaryStatus;
import com.civicpulse.welfare_service.entity.FundDisbursement;
import com.civicpulse.welfare_service.repository.BeneficiaryRepository;
import com.civicpulse.welfare_service.repository.BudgetRepository;
import com.civicpulse.welfare_service.repository.FundDisbursementRepository;
import com.civicpulse.welfare_service.repository.WelfareSchemeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DashboardService {

    private final WelfareSchemeRepository schemeRepo;
    private final BeneficiaryRepository beneficiaryRepo;
    private final BudgetRepository budgetRepo;
    private final FundDisbursementRepository disbursementRepo;

    public DashboardService(WelfareSchemeRepository schemeRepo,
                             BeneficiaryRepository beneficiaryRepo,
                             BudgetRepository budgetRepo,
                             FundDisbursementRepository disbursementRepo) {
        this.schemeRepo = schemeRepo;
        this.beneficiaryRepo = beneficiaryRepo;
        this.budgetRepo = budgetRepo;
        this.disbursementRepo = disbursementRepo;
    }

    public Map<String, Object> getStats() {
        long totalBeneficiaries = beneficiaryRepo.count();
        long totalSchemes = schemeRepo.count();

        BigDecimal totalBudgetAllocated = schemeRepo.findAll().stream()
                .map(s -> s.getBudgetAllocated() != null ? s.getBudgetAllocated() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalBudgetSpent = schemeRepo.findAll().stream()
                .map(s -> s.getBudgetSpent() != null ? s.getBudgetSpent() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal overallUtilization = totalBudgetAllocated.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : totalBudgetSpent.multiply(BigDecimal.valueOf(100))
                        .divide(totalBudgetAllocated, 2, RoundingMode.HALF_UP);

        // Beneficiaries by scheme name
        Map<String, Long> beneficiariesByScheme = new HashMap<>();
        schemeRepo.findAll().forEach(scheme -> {
            long count = beneficiaryRepo.countBySchemeId(scheme.getSchemeId());
            beneficiariesByScheme.put(scheme.getSchemeName(), count);
        });

        // Budget by department
        Map<String, BigDecimal> budgetByDepartment = new HashMap<>();
        budgetRepo.findAll().forEach(budget -> {
            budgetByDepartment.merge(budget.getDepartment(),
                    budget.getTotalAllocated() != null ? budget.getTotalAllocated() : BigDecimal.ZERO,
                    BigDecimal::add);
        });

        long pendingApplicationsCount = beneficiaryRepo.findByStatusIn(
                List.of(BeneficiaryStatus.APPLIED, BeneficiaryStatus.UNDER_REVIEW)).size();

        List<FundDisbursement> recentDisbursements = disbursementRepo.findTop10ByOrderByDisbursedDateDesc();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBeneficiaries", totalBeneficiaries);
        stats.put("totalSchemes", totalSchemes);
        stats.put("totalBudgetAllocated", totalBudgetAllocated);
        stats.put("totalBudgetSpent", totalBudgetSpent);
        stats.put("overallUtilizationPercent", overallUtilization);
        stats.put("beneficiariesByScheme", beneficiariesByScheme);
        stats.put("budgetByDepartment", budgetByDepartment);
        stats.put("pendingApplicationsCount", pendingApplicationsCount);
        stats.put("recentDisbursements", recentDisbursements);
        return stats;
    }
}
