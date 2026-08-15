package com.civicpulse.reporting_service.service;

import com.civicpulse.reporting_service.dto.DepartmentPerformance;
import com.civicpulse.reporting_service.dto.GovernanceSummary;
import com.civicpulse.reporting_service.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregates data from all downstream microservices.
 * Every call is wrapped in try/catch — partial data is returned rather than failing the whole report.
 *
 * Department names are normalised: trailing " Department" / " Dept" suffix stripped,
 * then de-duplicated so both "Electricity Department" and "Electricity" merge into one key.
 */
@Service
public class ReportAggregationService {

    private static final Logger log = LoggerFactory.getLogger(ReportAggregationService.class);

    private final RestClient restClient;
    private final FeedbackService feedbackService;
    private final AuditLogRepository auditLogRepository;

    public ReportAggregationService(FeedbackService feedbackService,
                                    AuditLogRepository auditLogRepository) {
        this.restClient = RestClient.builder()
            .requestInterceptor((request, body, execution) -> {
                org.springframework.web.context.request.RequestAttributes attributes =
                    org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attributes instanceof org.springframework.web.context.request.ServletRequestAttributes sra) {
                    String authHeader = sra.getRequest().getHeader("Authorization");
                    if (authHeader != null) {
                        request.getHeaders().add("Authorization", authHeader);
                    }
                }
                return execution.execute(request, body);
            })
            .build();
        this.feedbackService = feedbackService;
        this.auditLogRepository = auditLogRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INDIVIDUAL SERVICE CALLS
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchGrievanceStats() {
        try {
            Map<String, Object> stats = restClient.get()
                .uri("http://localhost:8083/api/complaints/dashboard/stats")
                .retrieve()
                .body(Map.class);
            return stats != null ? stats : new HashMap<>();
        } catch (RestClientException e) {
            log.warn("grievance-service unreachable: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> fetchOverdueComplaints() {
        try {
            List<Map<String, Object>> overdue = restClient.get()
                .uri("http://localhost:8083/api/complaints/overdue")
                .retrieve()
                .body(List.class);
            return overdue != null ? overdue : List.of();
        } catch (RestClientException e) {
            log.warn("Could not fetch overdue complaints: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchCertificateStats() {
        try {
            Map<String, Object> stats = restClient.get()
                .uri("http://localhost:8085/api/services/dashboard/stats")
                .retrieve()
                .body(Map.class);
            return stats != null ? stats : new HashMap<>();
        } catch (RestClientException e) {
            log.warn("service-management-service unreachable: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchRevenueSummary() {
        try {
            Map<String, Object> revenue = restClient.get()
                .uri("http://localhost:8085/api/services/revenue/summary")
                .retrieve()
                .body(Map.class);
            return revenue != null ? revenue : new HashMap<>();
        } catch (RestClientException e) {
            log.warn("Could not fetch revenue summary: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> fetchWelfareStats() {
        try {
            Map<String, Object> stats = restClient.get()
                .uri("http://localhost:8086/api/welfare/dashboard/stats")
                .retrieve()
                .body(Map.class);
            return stats != null ? stats : new HashMap<>();
        } catch (RestClientException e) {
            log.warn("welfare-service unreachable: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public long fetchCitizenCount() {
        try {
            List<Object> citizens = restClient.get()
                .uri("http://localhost:8082/api/citizens")
                .retrieve()
                .body(List.class);
            return citizens != null ? citizens.size() : 0L;
        } catch (RestClientException e) {
            log.warn("citizen-service unreachable: {}", e.getMessage());
            return -1L; // signals unavailable
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MASTER GOVERNANCE SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    public GovernanceSummary buildGovernanceSummary() {
        GovernanceSummary summary = new GovernanceSummary();

        // 1. Citizens
        long citizenCount = fetchCitizenCount();
        if (citizenCount < 0) {
            summary.setCitizenDataUnavailable(true);
            citizenCount = 0;
        }
        summary.setTotalCitizens(citizenCount);

        // 2. Grievance stats
        Map<String, Object> grievanceStats = fetchGrievanceStats();
        long totalComplaints       = 0;
        long resolvedComplaints    = 0;
        long pendingComplaints     = 0;
        long overdueCount          = 0;
        double grievanceResRate    = 0;
        Map<String, Long> grievanceByDept   = new HashMap<>();
        Map<String, Long> grievanceByStatus = new HashMap<>();

        if (grievanceStats == null) {
            summary.setGrievanceDataUnavailable(true);
        } else {
            totalComplaints    = toLong(grievanceStats.get("totalComplaints"));
            resolvedComplaints = toLong(grievanceStats.get("resolvedComplaints"));
            pendingComplaints  = toLong(grievanceStats.get("pendingComplaints"));
            overdueCount       = toLong(grievanceStats.get("overdueComplaints"));
            grievanceResRate   = toDouble(grievanceStats.get("resolutionRate"));

            @SuppressWarnings("unchecked")
            Map<String, Object> byDept = (Map<String, Object>) grievanceStats.get("byDepartment");
            if (byDept != null) {
                byDept.forEach((k, v) -> grievanceByDept.put(normalizeDeptName(k), toLong(v)));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> byStatus = (Map<String, Object>) grievanceStats.get("byStatus");
            if (byStatus != null) {
                byStatus.forEach((k, v) -> grievanceByStatus.put(k, toLong(v)));
            }
        }

        // Overdue accuracy — prefer live list size
        List<Map<String, Object>> overdueList = fetchOverdueComplaints();
        if (!overdueList.isEmpty()) overdueCount = overdueList.size();

        summary.setTotalComplaints(totalComplaints);
        summary.setResolvedComplaints(resolvedComplaints);
        summary.setPendingComplaints(pendingComplaints);
        summary.setOverdueComplaints(overdueCount);
        summary.setGrievanceResolutionRate(grievanceResRate);
        summary.setGrievanceByDepartment(grievanceByDept);
        summary.setGrievanceByStatus(grievanceByStatus);

        // 3. Certificate / Permit stats
        Map<String, Object> certStats = fetchCertificateStats();
        long totalCertApps        = 0;
        long certIssued           = 0;
        long pendingCertApps      = 0;
        long approvedCertApps     = 0;
        long rejectedCertApps     = 0;
        long underVerifCertApps   = 0;

        if (certStats == null) {
            summary.setCertificateDataUnavailable(true);
        } else {
            totalCertApps      = toLong(certStats.get("totalApplications"));
            certIssued         = toLong(certStats.get("certificatesIssued"));
            pendingCertApps    = toLong(certStats.get("pending"));
            approvedCertApps   = toLong(certStats.get("approved"));
            rejectedCertApps   = toLong(certStats.get("rejected"));
            underVerifCertApps = toLong(certStats.get("underVerification"));
        }

        summary.setTotalApplications(totalCertApps);
        summary.setCertificatesIssued(certIssued);
        summary.setPendingApplications(pendingCertApps);
        summary.setApprovedApplications(approvedCertApps);
        summary.setRejectedApplications(rejectedCertApps);
        summary.setUnderVerificationApplications(underVerifCertApps);

        // 4. Revenue
        Map<String, Object> revenueData = fetchRevenueSummary();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        if (revenueData != null && revenueData.get("totalFeesCollected") != null) {
            totalRevenue = new BigDecimal(revenueData.get("totalFeesCollected").toString());
        }
        summary.setTotalRevenue(totalRevenue);

        // 5. Welfare stats
        Map<String, Object> welfareStats = fetchWelfareStats();
        long welfareBeneficiaries    = 0;
        long welfarePendingApps      = 0;
        long activeSchemes           = 0;
        BigDecimal budgetAllocated   = BigDecimal.ZERO;
        BigDecimal budgetDisbursed   = BigDecimal.ZERO;
        double budgetUtilization     = 0;

        if (welfareStats == null) {
            summary.setWelfareDataUnavailable(true);
        } else {
            welfareBeneficiaries = toLong(welfareStats.get("totalBeneficiaries"));
            activeSchemes        = toLong(welfareStats.get("totalSchemes"));
            welfarePendingApps   = toLong(welfareStats.get("pendingApplicationsCount"));
            budgetUtilization    = toDouble(welfareStats.get("overallUtilizationPercent"));

            if (welfareStats.get("totalBudgetAllocated") != null) {
                budgetAllocated = new BigDecimal(welfareStats.get("totalBudgetAllocated").toString());
            }
            if (welfareStats.get("totalBudgetSpent") != null) {
                budgetDisbursed = new BigDecimal(welfareStats.get("totalBudgetSpent").toString());
            }
        }
        summary.setWelfareBeneficiaries(welfareBeneficiaries);
        summary.setWelfarePendingApplications(welfarePendingApps);
        summary.setActiveSchemes(activeSchemes);
        summary.setBudgetAllocated(budgetAllocated);
        summary.setBudgetDisbursed(budgetDisbursed);
        summary.setBudgetUtilizationPercent(budgetUtilization);

        // 6. Aggregate totals
        long totalRequests = totalComplaints + totalCertApps + welfareBeneficiaries;
        summary.setTotalRequests(totalRequests);
        summary.setOverdueOrEscalatedCount(overdueCount);

        // 7. Overall resolution rate — weighted across grievance + certs
        long totalResolved = resolvedComplaints + certIssued;
        double overallRate = totalRequests == 0 ? 0.0
                : Math.round((double) totalResolved / totalRequests * 10000.0) / 100.0;
        summary.setOverallResolutionRate(overallRate);

        // 8. Satisfaction score from local Feedback table
        summary.setCitizenSatisfactionScore(feedbackService.getOverallAverageRating());

        // 9. Complaint trend (proxy: fraction of complaints still unresolved)
        double trendPercent = totalComplaints > 0
                ? Math.round((1.0 - grievanceResRate / 100.0) * 100.0) / 100.0
                : 0.0;
        summary.setComplaintTrendPercent(trendPercent);

        // 10. Department performance — normalize + merge grievance by-department
        Map<String, DepartmentPerformance> deptPerformance = new LinkedHashMap<>();
        final double effGrievanceResRate = grievanceResRate > 0 ? grievanceResRate : 0.0;

        grievanceByDept.forEach((dept, count) ->
            deptPerformance.put(dept, new DepartmentPerformance(dept, count, effGrievanceResRate, 48.0))
        );

        // Merge welfare department names if they don't conflict
        if (welfareStats != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> budgetByDept = (Map<String, Object>) welfareStats.get("budgetByDepartment");
            if (budgetByDept != null) {
                budgetByDept.forEach((dept, budget) -> {
                    String normalized = normalizeDeptName(dept);
                    if (!deptPerformance.containsKey(normalized)) {
                        deptPerformance.put(normalized,
                            new DepartmentPerformance(normalized, 0, 0.0, 0.0));
                    }
                });
            }
        }
        summary.setDepartmentPerformance(deptPerformance);

        // 11. Audit risk counts from local DB
        try {
            long total = auditLogRepository.count();
            long recent = auditLogRepository.findFiltered(
                    null,
                    LocalDateTime.now().minusHours(24),
                    null,
                    PageRequest.of(0, 1)).getTotalElements();
            summary.setAuditTotalEvents(total);
            summary.setAuditRecentEvents24h(recent);
        } catch (Exception e) {
            log.warn("Could not fetch audit counts: {}", e.getMessage());
            summary.setAuditTotalEvents(0);
            summary.setAuditRecentEvents24h(0);
        }

        return summary;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Strips common department suffix variants so "Electricity Department"
     * and "Electricity" are treated as the same key.
     */
    public static String normalizeDeptName(String raw) {
        if (raw == null) return "Unknown";
        return raw.replaceAll("(?i)\\s+department\\s*$", "")
                  .replaceAll("(?i)\\s+dept\\.?\\s*$", "")
                  .trim();
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        try { return Long.parseLong(value.toString()); } catch (NumberFormatException e) { return 0L; }
    }

    private double toDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(value.toString()); } catch (NumberFormatException e) { return 0.0; }
    }
}
