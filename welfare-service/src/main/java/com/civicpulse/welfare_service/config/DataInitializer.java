package com.civicpulse.welfare_service.config;

import com.civicpulse.welfare_service.entity.Budget;
import com.civicpulse.welfare_service.entity.SchemeStatus;
import com.civicpulse.welfare_service.entity.WelfareScheme;
import com.civicpulse.welfare_service.repository.BudgetRepository;
import com.civicpulse.welfare_service.repository.WelfareSchemeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final WelfareSchemeRepository schemeRepo;
    private final BudgetRepository budgetRepo;

    public DataInitializer(WelfareSchemeRepository schemeRepo, BudgetRepository budgetRepo) {
        this.schemeRepo = schemeRepo;
        this.budgetRepo = budgetRepo;
    }

    @Override
    public void run(String... args) {
        log.info("Ensuring 4 standard government welfare schemes exist...");

        createOrUpdateScheme("National Scholarship Scheme", "Education Department",
                "Financial support for meritorious students pursuing higher education.",
                "Annual Income up to ₹2,50,000; Age 15-25 years",
                BigDecimal.ZERO, new BigDecimal("250000"), 15, 25, new BigDecimal("2000000"));

        createOrUpdateScheme("Old Age Pension", "Social Welfare Department",
                "Monthly pension for senior citizens below poverty line.",
                "Annual Income up to ₹1,20,000; Age 60 years and above",
                BigDecimal.ZERO, new BigDecimal("120000"), 60, 100, new BigDecimal("3500000"));

        createOrUpdateScheme("Women Entrepreneurship Scheme", "Social Welfare Department",
                "Soft loans & grants for women starting small businesses and micro-enterprises.",
                "Annual Income up to ₹5,00,000; Age 18-55 years; Female applicant",
                BigDecimal.ZERO, new BigDecimal("500000"), 18, 55, new BigDecimal("4000000"));

        createOrUpdateScheme("Health Assistance Scheme", "Health Department",
                "Comprehensive medical treatment coverage for critical illnesses.",
                "Annual Income up to ₹2,00,000; All ages eligible",
                BigDecimal.ZERO, new BigDecimal("200000"), 0, 100, new BigDecimal("3000000"));

        List<String> allowed = List.of(
            "National Scholarship Scheme",
            "Old Age Pension",
            "Women Entrepreneurship Scheme",
            "Health Assistance Scheme"
        );
        schemeRepo.findAll().forEach(s -> {
            if (!allowed.contains(s.getSchemeName())) {
                log.info("Removing legacy scheme not in 4 standard schemes: {}", s.getSchemeName());
                schemeRepo.delete(s);
            }
        });

        if (budgetRepo.count() == 0) {
            log.info("Seeding initial departmental budgets...");
            createBudget("Education Department", "2025-26", new BigDecimal("8000000"), 85);
            createBudget("Social Welfare Department", "2025-26", new BigDecimal("12000000"), 85);
            createBudget("Health Department", "2025-26", new BigDecimal("9000000"), 85);
            log.info("Seeded 3 departmental budgets successfully.");
        }
    }

    private void createOrUpdateScheme(String name, String dept, String desc, String criteria,
                                      BigDecimal minInc, BigDecimal maxInc, Integer minAge, Integer maxAge, BigDecimal budget) {
        WelfareScheme s = schemeRepo.findBySchemeName(name).orElseGet(() -> {
            WelfareScheme newScheme = new WelfareScheme();
            newScheme.setSchemeName(name);
            return newScheme;
        });
        s.setDepartment(dept);
        s.setDescription(desc);
        s.setEligibilityCriteria(criteria);
        s.setMinIncome(minInc);
        s.setMaxIncome(maxInc);
        s.setMinAge(minAge);
        s.setMaxAge(maxAge);
        s.setBudgetAllocated(budget);
        s.setStatus(SchemeStatus.ACTIVE);
        schemeRepo.save(s);
    }

    private void createBudget(String dept, String year, BigDecimal allocated, int alertPercent) {
        Budget b = new Budget();
        b.setDepartment(dept);
        b.setFiscalYear(year);
        b.setTotalAllocated(allocated);
        b.setTotalSpent(BigDecimal.ZERO);
        b.setAlertThresholdPercent(alertPercent);
        budgetRepo.save(b);
    }
}
