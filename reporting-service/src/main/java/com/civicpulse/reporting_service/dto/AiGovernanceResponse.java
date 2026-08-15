package com.civicpulse.reporting_service.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Structured response returned by the AI Governance Intelligence endpoints.
 * Mirrors the JSON shape requested from Gemini so it can be serialised directly.
 *
 * New in M4: departmentPriorities, welfareInsights, financialInsights,
 *            serviceInsights, slaInsights for section-level intelligence.
 */
public class AiGovernanceResponse {

    /** HIGH_PERFORMANCE | GOOD | NEEDS_ATTENTION | CRITICAL */
    private String overallStatus;

    /** One-paragraph executive summary of current governance health. */
    private String summary;

    /** 3-5 key analytical observations drawn from the live data. */
    private List<String> insights;

    /** Items that require immediate attention (empty list when all is well). */
    private List<String> warnings;

    /** Concrete, actionable recommendations for the admin. */
    private List<String> recommendations;

    /** Priority-ordered list of departments needing intervention. */
    private List<String> departmentPriorities;

    /** AI interpretation of welfare scheme & beneficiary data. */
    private List<String> welfareInsights;

    /** AI interpretation of revenue & collection data. */
    private List<String> financialInsights;

    /** AI interpretation of certificate/permit service data. */
    private List<String> serviceInsights;

    /** AI interpretation of SLA compliance & turnaround times. */
    private List<String> slaInsights;

    /** ISO timestamp of when this analysis was generated. */
    private String dataTimestamp;

    /** True when Gemini was unavailable — caller should show graceful fallback. */
    private boolean aiUnavailable;

    /** Optional error message shown to the user when aiUnavailable=true. */
    private String errorMessage;

    public AiGovernanceResponse() {}

    // ── Static factory helpers ────────────────────────────────────────────────

    public static AiGovernanceResponse unavailable(String reason) {
        AiGovernanceResponse r = new AiGovernanceResponse();
        r.aiUnavailable   = true;
        r.errorMessage    = reason;
        r.overallStatus   = "UNAVAILABLE";
        r.summary         = "AI insights are temporarily unavailable. Dashboard data remains available.";
        r.insights        = List.of();
        r.warnings        = List.of();
        r.recommendations = List.of();
        r.departmentPriorities = List.of();
        r.welfareInsights      = List.of();
        r.financialInsights    = List.of();
        r.serviceInsights      = List.of();
        r.slaInsights          = List.of();
        r.dataTimestamp   = LocalDateTime.now().toString();
        return r;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public String getOverallStatus()                     { return overallStatus; }
    public void setOverallStatus(String s)               { this.overallStatus = s; }

    public String getSummary()                           { return summary; }
    public void setSummary(String s)                     { this.summary = s; }

    public List<String> getInsights()                    { return insights; }
    public void setInsights(List<String> l)              { this.insights = l; }

    public List<String> getWarnings()                    { return warnings; }
    public void setWarnings(List<String> l)              { this.warnings = l; }

    public List<String> getRecommendations()             { return recommendations; }
    public void setRecommendations(List<String> l)       { this.recommendations = l; }

    public List<String> getDepartmentPriorities()        { return departmentPriorities; }
    public void setDepartmentPriorities(List<String> l)  { this.departmentPriorities = l; }

    public List<String> getWelfareInsights()             { return welfareInsights; }
    public void setWelfareInsights(List<String> l)       { this.welfareInsights = l; }

    public List<String> getFinancialInsights()           { return financialInsights; }
    public void setFinancialInsights(List<String> l)     { this.financialInsights = l; }

    public List<String> getServiceInsights()             { return serviceInsights; }
    public void setServiceInsights(List<String> l)       { this.serviceInsights = l; }

    public List<String> getSlaInsights()                 { return slaInsights; }
    public void setSlaInsights(List<String> l)           { this.slaInsights = l; }

    public String getDataTimestamp()                     { return dataTimestamp; }
    public void setDataTimestamp(String s)               { this.dataTimestamp = s; }

    public boolean isAiUnavailable()                     { return aiUnavailable; }
    public void setAiUnavailable(boolean b)              { this.aiUnavailable = b; }

    public String getErrorMessage()                      { return errorMessage; }
    public void setErrorMessage(String s)                { this.errorMessage = s; }
}
