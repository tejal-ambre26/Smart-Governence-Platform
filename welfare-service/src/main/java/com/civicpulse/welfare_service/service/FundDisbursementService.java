package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.entity.*;
import com.civicpulse.welfare_service.event.WelfareEvent;
import com.civicpulse.welfare_service.repository.BeneficiaryHistoryRepository;
import com.civicpulse.welfare_service.repository.BeneficiaryRepository;
import com.civicpulse.welfare_service.repository.FundDisbursementRepository;
import com.civicpulse.welfare_service.repository.WelfareSchemeRepository;
import com.civicpulse.welfare_service.repository.BudgetRepository;
import com.civicpulse.welfare_service.repository.ExpenseRepository;
import com.civicpulse.welfare_service.repository.AuditLogRepository;
import com.civicpulse.welfare_service.repository.PaymentReceiptRepository;
import com.civicpulse.welfare_service.util.TransactionIdGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class FundDisbursementService {
    private static final Logger log = LoggerFactory.getLogger(FundDisbursementService.class);

    private final FundDisbursementRepository disbursementRepo;
    private final BeneficiaryRepository beneficiaryRepo;
    private final BeneficiaryHistoryRepository historyRepo;
    private final WelfareSchemeRepository schemeRepo;
    private final BudgetRepository budgetRepo;
    private final ExpenseRepository expenseRepo;
    private final AuditLogRepository auditLogRepo;
    private final PaymentReceiptRepository receiptRepo;
    private final TransactionIdGenerator txnIdGenerator;
    private final WelfareEventPublisher eventPublisher;

    public FundDisbursementService(FundDisbursementRepository disbursementRepo,
                                    BeneficiaryRepository beneficiaryRepo,
                                    BeneficiaryHistoryRepository historyRepo,
                                    WelfareSchemeRepository schemeRepo,
                                    BudgetRepository budgetRepo,
                                    ExpenseRepository expenseRepo,
                                    AuditLogRepository auditLogRepo,
                                    PaymentReceiptRepository receiptRepo,
                                    TransactionIdGenerator txnIdGenerator,
                                    WelfareEventPublisher eventPublisher) {
        this.disbursementRepo = disbursementRepo;
        this.beneficiaryRepo = beneficiaryRepo;
        this.historyRepo = historyRepo;
        this.schemeRepo = schemeRepo;
        this.budgetRepo = budgetRepo;
        this.expenseRepo = expenseRepo;
        this.auditLogRepo = auditLogRepo;
        this.receiptRepo = receiptRepo;
        this.txnIdGenerator = txnIdGenerator;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public FundDisbursement disburse(UUID beneficiaryId, BigDecimal amount, PaymentMode paymentMode, String approvedBy) {
        // (a) Verify beneficiary is APPROVED
        Beneficiary beneficiary = beneficiaryRepo.findById(beneficiaryId)
                .orElseThrow(() -> new IllegalArgumentException("Beneficiary not found: " + beneficiaryId));
        if (beneficiary.getStatus() != BeneficiaryStatus.APPROVED) {
            throw new IllegalStateException(
                "Cannot disburse funds: beneficiary status is " + beneficiary.getStatus() + ", expected APPROVED");
        }

        // Budget constraint check: Ensure amount <= remaining budget
        WelfareScheme scheme = schemeRepo.findById(beneficiary.getSchemeId())
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found: " + beneficiary.getSchemeId()));
        BigDecimal currentSpent = scheme.getBudgetSpent() != null ? scheme.getBudgetSpent() : BigDecimal.ZERO;
        BigDecimal remainingSchemeBudget = scheme.getBudgetAllocated() != null
                ? scheme.getBudgetAllocated().subtract(currentSpent)
                : BigDecimal.ZERO;

        if (scheme.getBudgetAllocated() != null && amount.compareTo(remainingSchemeBudget) > 0) {
            throw new IllegalStateException(
                "Disbursement amount (" + amount + ") exceeds remaining scheme budget (" + remainingSchemeBudget + ")");
        }

        // (b) Create FundDisbursement with generated transactionId
        FundDisbursement disbursement = new FundDisbursement();
        disbursement.setBeneficiaryId(beneficiaryId);
        disbursement.setSchemeId(beneficiary.getSchemeId());
        disbursement.setAmount(amount);
        disbursement.setPaymentMode(paymentMode);
        disbursement.setPaymentStatus(PaymentStatus.COMPLETED);
        disbursement.setTransactionId(txnIdGenerator.generate());
        disbursement.setApprovedBy(approvedBy);
        FundDisbursement saved = disbursementRepo.save(disbursement);

        // (c) Update beneficiary status to FUNDS_DISBURSED
        BeneficiaryStatus prevStatus = beneficiary.getStatus();
        beneficiary.setStatus(BeneficiaryStatus.FUNDS_DISBURSED);
        beneficiaryRepo.save(beneficiary);

        // (e) Log to BeneficiaryHistory
        historyRepo.save(new BeneficiaryHistory(
                beneficiaryId, prevStatus, BeneficiaryStatus.FUNDS_DISBURSED,
                "Funds disbursed via " + paymentMode + " | TXN: " + saved.getTransactionId()));

        // (d) Increment Budget.totalSpent and WelfareScheme.budgetSpent
        BigDecimal newSpent = (scheme.getBudgetSpent() != null ? scheme.getBudgetSpent() : BigDecimal.ZERO).add(amount);
        scheme.setBudgetSpent(newSpent);
        schemeRepo.save(scheme);

        // Also update matching Budget rows for the same department
        String dept = scheme.getDepartment();
        budgetRepo.findByDepartment(dept).forEach(budget -> {
            BigDecimal budgetSpent = (budget.getTotalSpent() != null ? budget.getTotalSpent() : BigDecimal.ZERO).add(amount);
            budget.setTotalSpent(budgetSpent);
            budgetRepo.save(budget);

            // (f) Check alert threshold and publish Kafka event if breached
            if (budget.getUtilizationPercent().doubleValue() >= budget.getAlertThresholdPercent()) {
                eventPublisher.publishBudgetAlert(dept, budget.getFiscalYear(),
                        budget.getUtilizationPercent().doubleValue());
                log.warn("Budget threshold alert: dept={} utilization={}%", dept,
                        budget.getUtilizationPercent());
            }
        });

        // Module 6: Record Expense
        expenseRepo.save(new Expense(
            scheme.getDepartment(),
            beneficiary.getSchemeId(),
            beneficiaryId,
            amount,
            "Disbursement for " + beneficiary.getApplicantName() + " (" + beneficiary.getBeneficiaryCode() + ")",
            "DISBURSED"
        ));

        // Module 7: Generate Payment Receipt
        String receiptNumber = "RCPT-" + java.time.Year.now().getValue() + "-" + String.format("%06d", System.currentTimeMillis() % 1000000);
        receiptRepo.save(new PaymentReceipt(
            receiptNumber,
            saved.getTransactionId(),
            beneficiaryId,
            amount,
            scheme.getSchemeName(),
            beneficiary.getApplicantName()
        ));

        // Module 10: Audit Log
        auditLogRepo.save(new AuditLog(
            approvedBy,
            "ROLE_FINANCE_OFFICER",
            "DISBURSE_FUNDS",
            "FundDisbursement",
            saved.getDisbursementId().toString(),
            "APPROVED",
            "FUNDS_DISBURSED",
            "Disbursed ₹" + amount + " via " + paymentMode + " | TXN: " + saved.getTransactionId()
        ));

        // Publish disbursement & payment events
        WelfareEvent event = new WelfareEvent("FUNDS_DISBURSED", beneficiaryId,
                beneficiary.getBeneficiaryCode(), beneficiary.getCitizenId(),
                beneficiary.getApplicantName(), beneficiary.getSchemeId(), scheme.getSchemeName(),
                BeneficiaryStatus.FUNDS_DISBURSED.name(), null, saved.getTransactionId(), scheme.getDepartment());
        eventPublisher.publishDisbursed(event);
        eventPublisher.publishPaymentCompleted(event);

        return saved;
    }

    public List<FundDisbursement> getAll() {
        return disbursementRepo.findAll();
    }

    public List<FundDisbursement> getBySchemeId(UUID schemeId) {
        return disbursementRepo.findBySchemeId(schemeId);
    }

    public List<FundDisbursement> getByStatus(PaymentStatus status) {
        return disbursementRepo.findByPaymentStatus(status);
    }

    public List<FundDisbursement> getByBeneficiaryId(UUID beneficiaryId) {
        return disbursementRepo.findByBeneficiaryId(beneficiaryId);
    }
}
