package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.entity.*;
import com.civicpulse.welfare_service.event.WelfareEvent;
import com.civicpulse.welfare_service.exception.DuplicateApplicationException;
import com.civicpulse.welfare_service.repository.BeneficiaryHistoryRepository;
import com.civicpulse.welfare_service.repository.BeneficiaryRepository;
import com.civicpulse.welfare_service.repository.WelfareSchemeRepository;
import com.civicpulse.welfare_service.repository.BudgetRepository;
import com.civicpulse.welfare_service.util.BeneficiaryCodeGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BeneficiaryService {
    private static final Logger log = LoggerFactory.getLogger(BeneficiaryService.class);

    // ── Transition State Machine ────────────────────────────────────────────
    private static final Map<BeneficiaryStatus, EnumSet<BeneficiaryStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(BeneficiaryStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.DRAFT,
                EnumSet.of(BeneficiaryStatus.DRAFT, BeneficiaryStatus.SUBMITTED, BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.APPLIED,
                EnumSet.of(BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED, BeneficiaryStatus.DOCUMENTS_REQUESTED, BeneficiaryStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.SUBMITTED,
                EnumSet.of(BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED, BeneficiaryStatus.DOCUMENTS_REQUESTED, BeneficiaryStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT,
                EnumSet.of(BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED, BeneficiaryStatus.DOCUMENTS_REQUESTED, BeneficiaryStatus.WITHDRAWN));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.UNDER_REVIEW,
                EnumSet.of(BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED, BeneficiaryStatus.DOCUMENTS_REQUESTED, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION,
                EnumSet.of(BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED, BeneficiaryStatus.DOCUMENTS_REQUESTED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.DOCUMENTS_REQUESTED,
                EnumSet.of(BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, BeneficiaryStatus.SUBMITTED, BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.RECOMMENDED,
                EnumSet.of(BeneficiaryStatus.ADMIN_APPROVED, BeneficiaryStatus.APPROVED, BeneficiaryStatus.FUNDS_DISBURSED, BeneficiaryStatus.COMPLETED, BeneficiaryStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.ADMIN_APPROVED,
                EnumSet.of(BeneficiaryStatus.FUNDS_DISBURSED, BeneficiaryStatus.COMPLETED, BeneficiaryStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.APPROVED,
                EnumSet.of(BeneficiaryStatus.FUNDS_DISBURSED, BeneficiaryStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.FUNDS_DISBURSED,
                EnumSet.of(BeneficiaryStatus.COMPLETED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.REJECTED,
                EnumSet.of(BeneficiaryStatus.DRAFT, BeneficiaryStatus.SUBMITTED, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, BeneficiaryStatus.RECOMMENDED));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.WITHDRAWN, EnumSet.noneOf(BeneficiaryStatus.class));
        ALLOWED_TRANSITIONS.put(BeneficiaryStatus.COMPLETED, EnumSet.noneOf(BeneficiaryStatus.class));
    }

    private final BeneficiaryRepository beneficiaryRepo;
    private final BeneficiaryHistoryRepository historyRepo;
    private final WelfareSchemeRepository schemeRepo;
    private final BudgetRepository budgetRepo;
    private final BeneficiaryCodeGenerator codeGenerator;
    private final WelfareEventPublisher eventPublisher;

    public BeneficiaryService(BeneficiaryRepository beneficiaryRepo,
                               BeneficiaryHistoryRepository historyRepo,
                               WelfareSchemeRepository schemeRepo,
                               BudgetRepository budgetRepo,
                               BeneficiaryCodeGenerator codeGenerator,
                               WelfareEventPublisher eventPublisher) {
        this.beneficiaryRepo = beneficiaryRepo;
        this.historyRepo = historyRepo;
        this.schemeRepo = schemeRepo;
        this.budgetRepo = budgetRepo;
        this.codeGenerator = codeGenerator;
        this.eventPublisher = eventPublisher;
    }

    // ── Save Draft ──────────────────────────────────────────────────────────
    @Transactional
    public Beneficiary saveDraft(Beneficiary beneficiary) {
        beneficiary.setStatus(BeneficiaryStatus.DRAFT);
        if (beneficiary.getBeneficiaryCode() == null) {
            beneficiary.setBeneficiaryCode(codeGenerator.generate());
        }
        Beneficiary saved = beneficiaryRepo.save(beneficiary);
        addAudit(saved, null, BeneficiaryStatus.DRAFT, "Application Draft Saved", "Citizen", "Draft saved by citizen.");
        return saved;
    }

    // ── Update Draft ────────────────────────────────────────────────────────
    @Transactional
    public Beneficiary updateDraft(UUID id, Beneficiary updated) {
        Beneficiary existing = getById(id);
        if (existing.getStatus() != BeneficiaryStatus.DRAFT && existing.getStatus() != BeneficiaryStatus.REJECTED) {
            throw new IllegalStateException("Only DRAFT or REJECTED applications can be edited.");
        }
        existing.setApplicantName(updated.getApplicantName());
        existing.setApplicantAadhaar(updated.getApplicantAadhaar());
        existing.setAnnualIncome(updated.getAnnualIncome());
        existing.setAge(updated.getAge());
        existing.setFamilyStatus(updated.getFamilyStatus());
        existing.setAccountHolderName(updated.getAccountHolderName());
        existing.setBankName(updated.getBankName());
        existing.setAccountNumber(updated.getAccountNumber());
        existing.setIfscCode(updated.getIfscCode());
        existing.setBranchName(updated.getBranchName());
        existing.setDocumentsSubmitted(updated.getDocumentsSubmitted());
        
        Beneficiary saved = beneficiaryRepo.save(existing);
        addAudit(saved, existing.getStatus(), existing.getStatus(), "Draft Updated", "Citizen", "Citizen updated application details.");
        return saved;
    }

    // ── Delete Draft ────────────────────────────────────────────────────────
    @Transactional
    public void deleteDraft(UUID id, String citizenId) {
        Beneficiary b = getById(id);
        if (b.getStatus() != BeneficiaryStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT applications can be deleted.");
        }
        if (!b.getCitizenId().equalsIgnoreCase(citizenId)) {
            throw new IllegalStateException("Unauthorized to delete this draft.");
        }
        beneficiaryRepo.delete(b);
    }

    // ── Apply / Submit Application ──────────────────────────────────────────
    @Transactional
    public Beneficiary apply(UUID schemeId, Beneficiary beneficiary) {
        WelfareScheme scheme = schemeRepo.findById(schemeId)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found: " + schemeId));

        if (scheme.getStatus() != SchemeStatus.ACTIVE) {
            throw new IllegalStateException("Cannot apply to a scheme that is not ACTIVE");
        }

        // Single Active Application Rule Check:
        // Beneficiary is uniquely identified by applicantAadhaar (digits-only).
        // Checks across ALL schemes for any active application holding this Aadhaar identity.
        // Logged-in user account (citizenId/email) does NOT determine duplicate eligibility.
        String rawAadhaar = beneficiary.getApplicantAadhaar();
        if (rawAadhaar != null && !rawAadhaar.trim().isEmpty()) {
            String cleanAadhaar = rawAadhaar.replaceAll("[^0-9]", "");
            List<BeneficiaryStatus> activeStatuses = Arrays.asList(
                    BeneficiaryStatus.DRAFT,
                    BeneficiaryStatus.APPLIED,
                    BeneficiaryStatus.SUBMITTED,
                    BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT,
                    BeneficiaryStatus.UNDER_REVIEW,
                    BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION,
                    BeneficiaryStatus.DOCUMENTS_REQUESTED,
                    BeneficiaryStatus.RECOMMENDED,
                    BeneficiaryStatus.ADMIN_APPROVED,
                    BeneficiaryStatus.APPROVED,
                    BeneficiaryStatus.FUNDS_DISBURSED
            );
            
            List<Beneficiary> activeApps = beneficiaryRepo.findActiveApplicationsByAadhaar(cleanAadhaar, rawAadhaar, activeStatuses);
            Optional<Beneficiary> duplicate = activeApps.stream()
                    .filter(b -> beneficiary.getBeneficiaryId() == null || !b.getBeneficiaryId().equals(beneficiary.getBeneficiaryId()))
                    .findFirst();

            if (duplicate.isPresent()) {
                Beneficiary existingApp = duplicate.get();
                WelfareScheme existingScheme = schemeRepo.findById(existingApp.getSchemeId()).orElse(null);
                String existingSchemeName = existingScheme != null ? existingScheme.getSchemeName() : "Welfare Scheme";
                String maskedAadhaar = cleanAadhaar.length() >= 12 
                        ? "XXXX-XXXX-" + cleanAadhaar.substring(cleanAadhaar.length() - 4)
                        : rawAadhaar;
                String errorMsg = String.format(
                        "You already have an active application under Aadhaar %s (currently enrolled in %s). You cannot submit another application until the current application is completed, withdrawn, or rejected.",
                        maskedAadhaar, existingSchemeName
                );
                throw new DuplicateApplicationException(errorMsg, existingApp);
            }
        }

        beneficiary.setSchemeId(schemeId);
        if (beneficiary.getBeneficiaryCode() == null) {
            beneficiary.setBeneficiaryCode(codeGenerator.generate());
        }

        // Department Mapping
        String dept = scheme.getDepartment();
        beneficiary.setAssignedDepartment(dept);
        
        if ("Education Department".equalsIgnoreCase(dept)) {
            beneficiary.setAssignedOfficer("emily");
        } else if ("Social Welfare Department".equalsIgnoreCase(dept)) {
            beneficiary.setAssignedOfficer("david");
        } else if ("Health Department".equalsIgnoreCase(dept)) {
            beneficiary.setAssignedOfficer("john");
        }

        // Automated Eligibility Check
        boolean incomeOk = (scheme.getMinIncome() == null || beneficiary.getAnnualIncome() == null ||
                            beneficiary.getAnnualIncome().compareTo(scheme.getMinIncome()) >= 0)
                        && (scheme.getMaxIncome() == null || beneficiary.getAnnualIncome() == null ||
                            beneficiary.getAnnualIncome().compareTo(scheme.getMaxIncome()) <= 0);
        boolean ageOk = (scheme.getMinAge() == null || beneficiary.getAge() == null ||
                         beneficiary.getAge() >= scheme.getMinAge())
                     && (scheme.getMaxAge() == null || beneficiary.getAge() == null ||
                         beneficiary.getAge() <= scheme.getMaxAge());

        beneficiary.setEligibilityStatus(incomeOk && ageOk ? EligibilityStatus.ELIGIBLE : EligibilityStatus.NOT_ELIGIBLE);

        BeneficiaryStatus prevStatus = beneficiary.getStatus();
        beneficiary.setStatus(BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT);

        Beneficiary saved = beneficiaryRepo.save(beneficiary);

        // Audit Logs
        addAudit(saved, prevStatus, BeneficiaryStatus.SUBMITTED, "Application Submitted", "Citizen", "Citizen submitted welfare application.");
        addAudit(saved, BeneficiaryStatus.SUBMITTED, BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT, "Automatically Assigned to Department", "System Engine", "Assigned to " + dept + " (Officer: " + saved.getAssignedOfficer() + ").");

        safePublish(() -> eventPublisher.publishApplied(toEvent("BENEFICIARY_APPLIED", saved, scheme.getSchemeName(), "Submitted & Assigned to " + dept)));
        return saved;
    }

    // ── Withdraw Application (Citizen Action) ───────────────────────────────
    @Transactional
    public Beneficiary withdrawApplication(UUID id, String citizenId) {
        Beneficiary b = getById(id);
        if (b.getStatus() == BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION) {
            throw new IllegalStateException("Cannot withdraw application once officer has started verification audit.");
        }
        if (b.getStatus() == BeneficiaryStatus.RECOMMENDED || b.getStatus() == BeneficiaryStatus.FUNDS_DISBURSED || b.getStatus() == BeneficiaryStatus.COMPLETED) {
            throw new IllegalStateException("Application cannot be withdrawn in its current state.");
        }
        BeneficiaryStatus prev = b.getStatus();
        b.setStatus(BeneficiaryStatus.WITHDRAWN);
        Beneficiary saved = beneficiaryRepo.save(b);
        addAudit(saved, prev, BeneficiaryStatus.WITHDRAWN, "Application Withdrawn", "Citizen", "Citizen voluntarily withdrew the application.");
        return saved;
    }

    // ── Start Verification (Officer Action) ─────────────────────────────────
    @Transactional
    public Beneficiary startVerification(UUID id, String officerUsername) {
        Beneficiary b = getById(id);
        List<BeneficiaryStatus> validPriorStates = Arrays.asList(
            BeneficiaryStatus.APPLIED,
            BeneficiaryStatus.SUBMITTED, 
            BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT,
            BeneficiaryStatus.UNDER_REVIEW,
            BeneficiaryStatus.DOCUMENTS_REQUESTED
        );
        if (!validPriorStates.contains(b.getStatus())) {
            return b; // Do not transition if already past this stage
        }
        BeneficiaryStatus prev = b.getStatus();
        b.setStatus(BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION);
        b.setVerificationStartedAt(LocalDateTime.now());
        b.setExpectedCompletionDate(LocalDateTime.now().plusDays(2));
        if (officerUsername != null && !officerUsername.isBlank()) {
            b.setAssignedOfficer(officerUsername);
        }
        Beneficiary saved = beneficiaryRepo.save(b);
        addAudit(saved, prev, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, "Officer Verification Started", officerUsername, officerUsername + " started document and bank verification audit.");
        
        String schemeName = schemeRepo.findById(b.getSchemeId()).map(WelfareScheme::getSchemeName).orElse("Scheme");
        safePublish(() -> eventPublisher.publishVerified(toEvent("VERIFICATION_STARTED", saved, schemeName, "Verification started by " + officerUsername)));
        return saved;
    }

    // ── Verify Bank Details (Officer Action) ─────────────────────────────────
    @Transactional
    public Beneficiary verifyBankDetails(UUID id, boolean matches, String officerUsername, String remarks) {
        Beneficiary b = getById(id);
        b.setBankVerified(matches);
        b.setVerifiedByOfficer(officerUsername);
        Beneficiary saved = beneficiaryRepo.save(b);
        String resultText = matches ? "MATCHED (Form vs Uploaded Passbook verified clean)" : "MISMATCH (Form details do not match passbook)";
        addAudit(saved, b.getStatus(), b.getStatus(), "Bank Account Verification", officerUsername, resultText + " — " + (remarks != null ? remarks : ""));
        return saved;
    }

    // ── Recommend Approval (Officer Action 1) ────────────────────────────────
    @Transactional
    public Beneficiary recommendApproval(UUID id, String officerUsername, String remarks) {
        Beneficiary b = getById(id);
        BeneficiaryStatus prev = b.getStatus();
        b.setStatus(BeneficiaryStatus.RECOMMENDED);
        b.setRecommendationStatus("RECOMMENDED");
        b.setRecommendationRemarks(remarks != null && !remarks.isBlank() ? remarks : "Verified clean and recommended for approval.");
        b.setBankVerified(true);
        b.setVerifiedByOfficer(officerUsername);
        if (officerUsername != null && !officerUsername.isBlank()) {
            b.setAssignedOfficer(officerUsername);
        }
        Beneficiary saved = beneficiaryRepo.save(b);

        addAudit(saved, prev, BeneficiaryStatus.RECOMMENDED, "Recommendation Submitted", officerUsername, b.getRecommendationRemarks());

        String schemeName = schemeRepo.findById(b.getSchemeId()).map(WelfareScheme::getSchemeName).orElse("Scheme");
        safePublish(() -> eventPublisher.publishVerified(toEvent("BENEFICIARY_RECOMMENDED", saved, schemeName, b.getRecommendationRemarks())));
        return saved;
    }

    // ── Reject Application (Officer Action 2) ────────────────────────────────
    @Transactional
    public Beneficiary reject(UUID id, String officerUsername, String reason) {
        Beneficiary b = getById(id);
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Rejection reason is mandatory.");
        }
        BeneficiaryStatus prev = b.getStatus();
        b.setStatus(BeneficiaryStatus.REJECTED);
        b.setRejectionReason(reason);
        if (officerUsername != null && !officerUsername.isBlank()) {
            b.setAssignedOfficer(officerUsername);
        }
        Beneficiary saved = beneficiaryRepo.save(b);

        addAudit(saved, prev, BeneficiaryStatus.REJECTED, "Application Rejected", officerUsername, "Reason: " + reason);

        String schemeName = schemeRepo.findById(b.getSchemeId()).map(WelfareScheme::getSchemeName).orElse("Scheme");
        safePublish(() -> eventPublisher.publishRejected(toEvent("BENEFICIARY_REJECTED", saved, schemeName, reason)));
        return saved;
    }

    // ── Request Additional Documents (Officer Action 3) ──────────────────────
    @Transactional
    public Beneficiary requestAdditionalDocuments(UUID id, String officerUsername, String remarks) {
        Beneficiary b = getById(id);
        BeneficiaryStatus prev = b.getStatus();
        b.setStatus(BeneficiaryStatus.DOCUMENTS_REQUESTED);
        b.setRecommendationRemarks(remarks);
        if (officerUsername != null && !officerUsername.isBlank()) {
            b.setAssignedOfficer(officerUsername);
        }
        Beneficiary saved = beneficiaryRepo.save(b);

        addAudit(saved, prev, BeneficiaryStatus.DOCUMENTS_REQUESTED, "Additional Documents Requested", officerUsername, remarks);

        String schemeName = schemeRepo.findById(b.getSchemeId()).map(WelfareScheme::getSchemeName).orElse("Scheme");
        safePublish(() -> eventPublisher.publishVerified(toEvent("ADDITIONAL_DOCS_REQUESTED", saved, schemeName, remarks)));
        return saved;
    }

    // ── Resubmit Documents / Application (Citizen Action) ────────────────────
    @Transactional
    public Beneficiary resubmitDocuments(UUID id, String newDocs, String citizenRemarks) {
        Beneficiary b = getById(id);
        BeneficiaryStatus prev = b.getStatus();
        if (newDocs != null && !newDocs.isBlank()) {
            b.setDocumentsSubmitted(newDocs);
        }
        b.setStatus(BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION);
        Beneficiary saved = beneficiaryRepo.save(b);

        addAudit(saved, prev, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION, "Citizen Resubmitted Documents", "Citizen", "Resubmitted documents for officer re-verification.");
        
        String schemeName = schemeRepo.findById(b.getSchemeId()).map(WelfareScheme::getSchemeName).orElse("Scheme");
        safePublish(() -> eventPublisher.publishApplied(toEvent("BENEFICIARY_RESUBMITTED", saved, schemeName, "Revised documents uploaded by citizen")));
        return saved;
    }

    // ── Execute Direct Benefit Transfer (DBT) (Admin Action) ────────────────
    @Transactional
    public Beneficiary executeDBT(UUID id, String adminUsername) {
        Beneficiary b = getById(id);
        WelfareScheme scheme = schemeRepo.findById(b.getSchemeId())
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found"));

        BeneficiaryStatus prev = b.getStatus();
        b.setAdminDecision("APPROVED");
        b.setApprovedDate(LocalDateTime.now());

        // Generate Transaction Reference
        String txnId = "DBT-2026-" + String.format("%06d", Math.abs(b.getBeneficiaryCode().hashCode() % 1000000));
        String payRef = "REF-DBT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        BigDecimal amount = (scheme.getBenefitAmount() != null) ? scheme.getBenefitAmount() : new BigDecimal("25000.00");

        b.setTransactionId(txnId);
        b.setPaymentReference(payRef);
        b.setDisbursedAmount(amount);
        b.setFundTransferStatus("SUCCESS");
        b.setStatus(BeneficiaryStatus.COMPLETED);

        Beneficiary saved = beneficiaryRepo.save(b);

        // Update Scheme Beneficiary Count and Budget Spent
        scheme.setBeneficiaryCount(scheme.getBeneficiaryCount() + 1);
        BigDecimal currentSpent = scheme.getBudgetSpent() != null ? scheme.getBudgetSpent() : BigDecimal.ZERO;
        scheme.setBudgetSpent(currentSpent.add(amount));
        schemeRepo.save(scheme);

        // Update matching Department Budget
        String dept = scheme.getDepartment();
        budgetRepo.findByDepartment(dept).forEach(budget -> {
            BigDecimal budgetSpent = (budget.getTotalSpent() != null ? budget.getTotalSpent() : BigDecimal.ZERO).add(amount);
            budget.setTotalSpent(budgetSpent);
            budgetRepo.save(budget);
        });

        // Audit Events
        addAudit(saved, prev, BeneficiaryStatus.ADMIN_APPROVED, "Admin Approved Financial Release", adminUsername, "Financial sanction granted.");
        addAudit(saved, BeneficiaryStatus.ADMIN_APPROVED, BeneficiaryStatus.FUNDS_DISBURSED, "Direct Benefit Transfer (DBT) Executed", "DBT Payment Gateway", "Transferred " + amount + " to " + b.getBankName() + " (" + b.getAccountNumber() + "). TxnId: " + txnId);
        addAudit(saved, BeneficiaryStatus.FUNDS_DISBURSED, BeneficiaryStatus.COMPLETED, "Payment Receipt Generated", "System", "Government DBT Payment Receipt issued.");

        safePublish(() -> eventPublisher.publishApproved(toEvent("BENEFICIARY_APPROVED", saved, scheme.getSchemeName(), "Admin Approved")));
        safePublish(() -> eventPublisher.publishDisbursed(toEvent("FUNDS_DISBURSED", saved, scheme.getSchemeName(), "DBT Executed: " + txnId)));
        return saved;
    }

    // ── Query methods ────────────────────────────────────────────────────────
    public Beneficiary getById(UUID id) {
        return beneficiaryRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Beneficiary not found: " + id));
    }

    public List<Beneficiary> getByCitizenId(String citizenId) {
        return beneficiaryRepo.findByCitizenId(citizenId);
    }

    public List<Beneficiary> getByDepartment(String departmentName) {
        if (departmentName == null || departmentName.isBlank() || "All Departments".equalsIgnoreCase(departmentName)) {
            return beneficiaryRepo.findAll();
        }
        return beneficiaryRepo.findByAssignedDepartmentIgnoreCase(departmentName.trim());
    }

    public List<Beneficiary> getRecommended() {
        return beneficiaryRepo.findByStatusIn(
                List.of(BeneficiaryStatus.RECOMMENDED, BeneficiaryStatus.ADMIN_APPROVED));
    }

    public List<Beneficiary> getPending() {
        return beneficiaryRepo.findByStatusIn(
                List.of(BeneficiaryStatus.APPLIED, BeneficiaryStatus.SUBMITTED,
                        BeneficiaryStatus.ASSIGNED_TO_DEPARTMENT, BeneficiaryStatus.UNDER_DEPARTMENT_VERIFICATION,
                        BeneficiaryStatus.UNDER_REVIEW, BeneficiaryStatus.RECOMMENDED));
    }

    public List<Beneficiary> getAll() {
        return beneficiaryRepo.findAll();
    }

    public List<BeneficiaryHistory> getHistory(UUID beneficiaryId) {
        return historyRepo.findByBeneficiaryIdOrderByTimestampAsc(beneficiaryId);
    }

    // ── Delete Application Completely ─────────────────────────────────────
    @Transactional
    public void deleteApplication(UUID id) {
        Beneficiary b = getById(id);
        historyRepo.deleteByBeneficiaryId(b.getBeneficiaryId());
        beneficiaryRepo.delete(b);
    }

    // ── Delete All Applications (Full Database Reset) ─────────────────────
    @Transactional
    public void deleteAllApplications() {
        historyRepo.deleteAll();
        beneficiaryRepo.deleteAll();
    }

    // ── Internal Helpers ────────────────────────────────────────────────────
    private void safePublish(Runnable action) {
        try {
            action.run();
        } catch (Exception e) {
            log.warn("Non-fatal event publishing error skipped: {}", e.getMessage());
        }
    }

    private void addAudit(Beneficiary b, BeneficiaryStatus prev, BeneficiaryStatus next,
                           String actionTitle, String actorName, String remarks) {
        historyRepo.save(new BeneficiaryHistory(b.getBeneficiaryId(), prev, next, actionTitle, actorName, remarks));
    }

    private WelfareEvent toEvent(String type, Beneficiary b, String schemeName, String remarks) {
        return new WelfareEvent(type, b.getBeneficiaryId(), b.getBeneficiaryCode(), b.getCitizenId(),
                b.getApplicantName(), b.getSchemeId(), schemeName, b.getStatus().name(), remarks, b.getTransactionId(), b.getAssignedDepartment());
    }
}
