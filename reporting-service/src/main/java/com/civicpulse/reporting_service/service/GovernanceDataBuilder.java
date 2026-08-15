package com.civicpulse.reporting_service.service;

import com.civicpulse.reporting_service.dto.DepartmentPerformance;
import com.civicpulse.reporting_service.dto.GovernanceSummary;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Transforms the live GovernanceSummary into a compact, PII-free JSON string
 * that is safe to send to the Gemini API.
 *
 * SECURITY RULES (strictly enforced here):
 *  - No citizen names, Aadhaar numbers, phone numbers, or addresses.
 *  - No JWT tokens, passwords, or authentication data.
 *  - No bank account numbers or individual financial records.
 *  - Only aggregated counts, rates, and percentages.
 */
@Component
public class GovernanceDataBuilder {

    /**
     * Produces a compact JSON string of aggregated governance statistics
     * ready to embed in a Gemini prompt.
     */
    public String buildSafeStatsJson(GovernanceSummary summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        sb.append("  \"reportDate\": \"").append(LocalDateTime.now().toLocalDate()).append("\",\n");
        sb.append("  \"reportTime\": \"").append(LocalDateTime.now().toLocalTime().withNano(0)).append("\",\n");

        // ── Cross-service totals ──────────────────────────────────────────────
        sb.append("  \"totalCitizens\": ").append(summary.getTotalCitizens()).append(",\n");
        sb.append("  \"totalRequests\": ").append(summary.getTotalRequests()).append(",\n");
        sb.append("  \"overallResolutionRate\": ").append(round2(summary.getOverallResolutionRate())).append(",\n");
        sb.append("  \"overdueOrEscalatedCount\": ").append(summary.getOverdueOrEscalatedCount()).append(",\n");
        sb.append("  \"citizenSatisfactionScore\": ").append(round2(summary.getCitizenSatisfactionScore())).append(",\n");
        sb.append("  \"satisfactionDataAvailable\": ").append(summary.getCitizenSatisfactionScore() > 0).append(",\n");

        // ── Grievance detail ─────────────────────────────────────────────────
        sb.append("  \"grievance\": {\n");
        sb.append("    \"total\": ").append(summary.getTotalComplaints()).append(",\n");
        sb.append("    \"resolved\": ").append(summary.getResolvedComplaints()).append(",\n");
        sb.append("    \"pending\": ").append(summary.getPendingComplaints()).append(",\n");
        sb.append("    \"overdue\": ").append(summary.getOverdueComplaints()).append(",\n");
        sb.append("    \"resolutionRate\": ").append(round2(summary.getGrievanceResolutionRate())).append(",\n");
        sb.append("    \"dataAvailable\": ").append(!summary.isGrievanceDataUnavailable()).append(",\n");

        // Department distribution (aggregate only)
        sb.append("    \"byDepartment\": {");
        if (summary.getGrievanceByDepartment() != null && !summary.getGrievanceByDepartment().isEmpty()) {
            List<Map.Entry<String, Long>> entries = new ArrayList<>(summary.getGrievanceByDepartment().entrySet());
            for (int i = 0; i < entries.size(); i++) {
                sb.append("\"").append(sanitise(entries.get(i).getKey())).append("\": ").append(entries.get(i).getValue());
                if (i < entries.size() - 1) sb.append(", ");
            }
        }
        sb.append("},\n");

        // Status distribution
        sb.append("    \"byStatus\": {");
        if (summary.getGrievanceByStatus() != null && !summary.getGrievanceByStatus().isEmpty()) {
            List<Map.Entry<String, Long>> statusEntries = new ArrayList<>(summary.getGrievanceByStatus().entrySet());
            for (int i = 0; i < statusEntries.size(); i++) {
                sb.append("\"").append(statusEntries.get(i).getKey()).append("\": ").append(statusEntries.get(i).getValue());
                if (i < statusEntries.size() - 1) sb.append(", ");
            }
        }
        sb.append("}\n");
        sb.append("  },\n");

        // ── Certificate / Permit detail ──────────────────────────────────────
        sb.append("  \"certificates\": {\n");
        sb.append("    \"totalApplications\": ").append(summary.getTotalApplications()).append(",\n");
        sb.append("    \"pending\": ").append(summary.getPendingApplications()).append(",\n");
        sb.append("    \"underVerification\": ").append(summary.getUnderVerificationApplications()).append(",\n");
        sb.append("    \"approved\": ").append(summary.getApprovedApplications()).append(",\n");
        sb.append("    \"rejected\": ").append(summary.getRejectedApplications()).append(",\n");
        sb.append("    \"issued\": ").append(summary.getCertificatesIssued()).append(",\n");
        sb.append("    \"dataAvailable\": ").append(!summary.isCertificateDataUnavailable()).append("\n");
        sb.append("  },\n");

        // ── Revenue ──────────────────────────────────────────────────────────
        sb.append("  \"revenue\": {\n");
        sb.append("    \"totalFeesCollectedINR\": ").append(
            summary.getTotalRevenue() != null ? summary.getTotalRevenue().toPlainString() : "0"
        ).append("\n");
        sb.append("  },\n");

        // ── Welfare ──────────────────────────────────────────────────────────
        sb.append("  \"welfare\": {\n");
        sb.append("    \"totalBeneficiaries\": ").append(summary.getWelfareBeneficiaries()).append(",\n");
        sb.append("    \"pendingApplications\": ").append(summary.getWelfarePendingApplications()).append(",\n");
        sb.append("    \"activeSchemes\": ").append(summary.getActiveSchemes()).append(",\n");
        sb.append("    \"budgetAllocatedINR\": ").append(
            summary.getBudgetAllocated() != null ? summary.getBudgetAllocated().toPlainString() : "0"
        ).append(",\n");
        sb.append("    \"budgetDisbursedINR\": ").append(
            summary.getBudgetDisbursed() != null ? summary.getBudgetDisbursed().toPlainString() : "0"
        ).append(",\n");
        sb.append("    \"utilizationPercent\": ").append(round2(summary.getBudgetUtilizationPercent())).append(",\n");
        sb.append("    \"dataAvailable\": ").append(!summary.isWelfareDataUnavailable()).append("\n");
        sb.append("  },\n");

        // ── Audit / Activity ─────────────────────────────────────────────────
        sb.append("  \"audit\": {\n");
        sb.append("    \"totalEvents\": ").append(summary.getAuditTotalEvents()).append(",\n");
        sb.append("    \"recentEvents24h\": ").append(summary.getAuditRecentEvents24h()).append("\n");
        sb.append("  },\n");

        // ── Data availability flags ──────────────────────────────────────────
        sb.append("  \"dataAvailability\": {\n");
        sb.append("    \"grievance\": ").append(!summary.isGrievanceDataUnavailable()).append(",\n");
        sb.append("    \"certificate\": ").append(!summary.isCertificateDataUnavailable()).append(",\n");
        sb.append("    \"welfare\": ").append(!summary.isWelfareDataUnavailable()).append(",\n");
        sb.append("    \"citizen\": ").append(!summary.isCitizenDataUnavailable()).append("\n");
        sb.append("  },\n");

        // ── Department performance ────────────────────────────────────────────
        sb.append("  \"departments\": [\n");
        Map<String, DepartmentPerformance> depts = summary.getDepartmentPerformance();
        if (depts != null && !depts.isEmpty()) {
            List<Map.Entry<String, DepartmentPerformance>> entries = new ArrayList<>(depts.entrySet());
            for (int i = 0; i < entries.size(); i++) {
                DepartmentPerformance d = entries.get(i).getValue();
                sb.append("    {\n");
                sb.append("      \"name\": \"").append(sanitise(d.getDepartment())).append("\",\n");
                sb.append("      \"totalHandled\": ").append(d.getTotalHandled()).append(",\n");
                sb.append("      \"resolutionRate\": ").append(round2(d.getResolutionRate())).append(",\n");
                sb.append("      \"avgTurnaroundHours\": ").append(round2(d.getAvgTurnaroundHours())).append("\n");
                sb.append("    }");
                if (i < entries.size() - 1) sb.append(",");
                sb.append("\n");
            }
        }
        sb.append("  ]\n");
        sb.append("}");
        return sb.toString();
    }

    /** Remove any characters that could cause prompt injection. */
    private String sanitise(String input) {
        if (input == null) return "Unknown";
        return input.replaceAll("[\"\\\\<>]", "").trim();
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
