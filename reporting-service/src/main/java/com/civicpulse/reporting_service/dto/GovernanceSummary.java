package com.civicpulse.reporting_service.dto;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Master governance analytics dashboard response.
 * Aggregated from all downstream microservices.
 * All numeric fields are zero-safe (never null for numbers).
 */
public class GovernanceSummary {

    // ── Cross-service totals ──────────────────────────────────────────────────
    private long totalCitizens;
    private long totalRequests;            // complaints + cert apps + welfare apps
    private double overallResolutionRate;  // % resolved across all types
    private BigDecimal totalRevenue;
    private double budgetUtilizationPercent;
    private double citizenSatisfactionScore;
    private double complaintTrendPercent;
    private long overdueOrEscalatedCount;

    // ── Grievance detail ─────────────────────────────────────────────────────
    private long totalComplaints;
    private long resolvedComplaints;
    private long pendingComplaints;
    private long overdueComplaints;
    private double grievanceResolutionRate;
    private Map<String, Long> grievanceByDepartment;
    private Map<String, Long> grievanceByStatus;

    // ── Certificate / Permit detail ──────────────────────────────────────────
    private long totalApplications;
    private long pendingApplications;
    private long approvedApplications;
    private long rejectedApplications;
    private long certificatesIssued;
    private long underVerificationApplications;

    // ── Welfare detail ───────────────────────────────────────────────────────
    private long welfareBeneficiaries;
    private long welfarePendingApplications;
    private long activeSchemes;
    private BigDecimal budgetAllocated;
    private BigDecimal budgetDisbursed;

    // ── Department performance map ────────────────────────────────────────────
    private Map<String, DepartmentPerformance> departmentPerformance;

    // ── Audit/Risk counts (from local audit_logs table) ───────────────────────
    private long auditTotalEvents;
    private long auditRecentEvents24h;

    // ── Partial-data flags: true = that service was unreachable ──────────────
    private boolean citizenDataUnavailable;
    private boolean grievanceDataUnavailable;
    private boolean certificateDataUnavailable;
    private boolean welfareDataUnavailable;

    public GovernanceSummary() {}

    // ── Getters ──────────────────────────────────────────────────────────────
    public long getTotalCitizens() { return totalCitizens; }
    public long getTotalRequests() { return totalRequests; }
    public double getOverallResolutionRate() { return overallResolutionRate; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public double getBudgetUtilizationPercent() { return budgetUtilizationPercent; }
    public double getCitizenSatisfactionScore() { return citizenSatisfactionScore; }
    public double getComplaintTrendPercent() { return complaintTrendPercent; }
    public long getOverdueOrEscalatedCount() { return overdueOrEscalatedCount; }

    public long getTotalComplaints() { return totalComplaints; }
    public long getResolvedComplaints() { return resolvedComplaints; }
    public long getPendingComplaints() { return pendingComplaints; }
    public long getOverdueComplaints() { return overdueComplaints; }
    public double getGrievanceResolutionRate() { return grievanceResolutionRate; }
    public Map<String, Long> getGrievanceByDepartment() { return grievanceByDepartment; }
    public Map<String, Long> getGrievanceByStatus() { return grievanceByStatus; }

    public long getTotalApplications() { return totalApplications; }
    public long getPendingApplications() { return pendingApplications; }
    public long getApprovedApplications() { return approvedApplications; }
    public long getRejectedApplications() { return rejectedApplications; }
    public long getCertificatesIssued() { return certificatesIssued; }
    public long getUnderVerificationApplications() { return underVerificationApplications; }

    public long getWelfareBeneficiaries() { return welfareBeneficiaries; }
    public long getWelfarePendingApplications() { return welfarePendingApplications; }
    public long getActiveSchemes() { return activeSchemes; }
    public BigDecimal getBudgetAllocated() { return budgetAllocated; }
    public BigDecimal getBudgetDisbursed() { return budgetDisbursed; }

    public Map<String, DepartmentPerformance> getDepartmentPerformance() { return departmentPerformance; }

    public long getAuditTotalEvents() { return auditTotalEvents; }
    public long getAuditRecentEvents24h() { return auditRecentEvents24h; }

    public boolean isCitizenDataUnavailable() { return citizenDataUnavailable; }
    public boolean isGrievanceDataUnavailable() { return grievanceDataUnavailable; }
    public boolean isCertificateDataUnavailable() { return certificateDataUnavailable; }
    public boolean isWelfareDataUnavailable() { return welfareDataUnavailable; }

    // ── Setters ──────────────────────────────────────────────────────────────
    public void setTotalCitizens(long v) { this.totalCitizens = v; }
    public void setTotalRequests(long v) { this.totalRequests = v; }
    public void setOverallResolutionRate(double v) { this.overallResolutionRate = v; }
    public void setTotalRevenue(BigDecimal v) { this.totalRevenue = v; }
    public void setBudgetUtilizationPercent(double v) { this.budgetUtilizationPercent = v; }
    public void setCitizenSatisfactionScore(double v) { this.citizenSatisfactionScore = v; }
    public void setComplaintTrendPercent(double v) { this.complaintTrendPercent = v; }
    public void setOverdueOrEscalatedCount(long v) { this.overdueOrEscalatedCount = v; }

    public void setTotalComplaints(long v) { this.totalComplaints = v; }
    public void setResolvedComplaints(long v) { this.resolvedComplaints = v; }
    public void setPendingComplaints(long v) { this.pendingComplaints = v; }
    public void setOverdueComplaints(long v) { this.overdueComplaints = v; }
    public void setGrievanceResolutionRate(double v) { this.grievanceResolutionRate = v; }
    public void setGrievanceByDepartment(Map<String, Long> v) { this.grievanceByDepartment = v; }
    public void setGrievanceByStatus(Map<String, Long> v) { this.grievanceByStatus = v; }

    public void setTotalApplications(long v) { this.totalApplications = v; }
    public void setPendingApplications(long v) { this.pendingApplications = v; }
    public void setApprovedApplications(long v) { this.approvedApplications = v; }
    public void setRejectedApplications(long v) { this.rejectedApplications = v; }
    public void setCertificatesIssued(long v) { this.certificatesIssued = v; }
    public void setUnderVerificationApplications(long v) { this.underVerificationApplications = v; }

    public void setWelfareBeneficiaries(long v) { this.welfareBeneficiaries = v; }
    public void setWelfarePendingApplications(long v) { this.welfarePendingApplications = v; }
    public void setActiveSchemes(long v) { this.activeSchemes = v; }
    public void setBudgetAllocated(BigDecimal v) { this.budgetAllocated = v; }
    public void setBudgetDisbursed(BigDecimal v) { this.budgetDisbursed = v; }

    public void setDepartmentPerformance(Map<String, DepartmentPerformance> v) { this.departmentPerformance = v; }

    public void setAuditTotalEvents(long v) { this.auditTotalEvents = v; }
    public void setAuditRecentEvents24h(long v) { this.auditRecentEvents24h = v; }

    public void setCitizenDataUnavailable(boolean v) { this.citizenDataUnavailable = v; }
    public void setGrievanceDataUnavailable(boolean v) { this.grievanceDataUnavailable = v; }
    public void setCertificateDataUnavailable(boolean v) { this.certificateDataUnavailable = v; }
    public void setWelfareDataUnavailable(boolean v) { this.welfareDataUnavailable = v; }
}
