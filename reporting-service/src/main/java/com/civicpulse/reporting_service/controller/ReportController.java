package com.civicpulse.reporting_service.controller;

import com.civicpulse.reporting_service.dto.FeedbackAverageResponse;
import com.civicpulse.reporting_service.dto.GovernanceSummary;
import com.civicpulse.reporting_service.entity.AuditLog;
import com.civicpulse.reporting_service.entity.Feedback;
import com.civicpulse.reporting_service.repository.AuditLogRepository;
import com.civicpulse.reporting_service.service.FeedbackService;
import com.civicpulse.reporting_service.service.ReportAggregationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final FeedbackService feedbackService;
    private final ReportAggregationService aggregationService;
    private final AuditLogRepository auditLogRepository;

    public ReportController(FeedbackService feedbackService,
                             ReportAggregationService aggregationService,
                             AuditLogRepository auditLogRepository) {
        this.feedbackService = feedbackService;
        this.aggregationService = aggregationService;
        this.auditLogRepository = auditLogRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEEDBACK
    // ─────────────────────────────────────────────────────────────────────────

    /** Citizen submits a 1-5 star rating after terminal state reached */
    @PostMapping("/feedback")
    @PreAuthorize("hasAnyRole('CITIZEN','ADMIN')")
    public ResponseEntity<Feedback> submitFeedback(@Valid @RequestBody Feedback feedback) {
        return ResponseEntity.ok(feedbackService.submitFeedback(feedback));
    }

    /** Overall average + breakdown by reference type — ADMIN only */
    @GetMapping("/feedback/average")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeedbackAverageResponse> getFeedbackAverage() {
        return ResponseEntity.ok(feedbackService.getAverageBreakdown());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIT LOGS — most sensitive; ADMIN only (APPROVER can view single entity)
    // ─────────────────────────────────────────────────────────────────────────

    /** Paginated audit log with optional filters — ADMIN only */
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(auditLogRepository.findFiltered(eventType, from, to, pageable));
    }

    /** Full audit trail for a single entity (complaint/application/beneficiary) — ADMIN + APPROVER */
    @GetMapping("/audit-logs/entity/{entityId}")
    @PreAuthorize("hasAnyRole('ADMIN','APPROVER')")
    public ResponseEntity<List<AuditLog>> getEntityAuditTrail(@PathVariable String entityId) {
        return ResponseEntity.ok(auditLogRepository.findByEntityIdOrderByReceivedAtAsc(entityId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOVERNANCE ANALYTICS DASHBOARD — ADMIN only
    // ─────────────────────────────────────────────────────────────────────────

    /** Master aggregate endpoint — combines all services into one response */
    @GetMapping("/governance/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GovernanceSummary> getGovernanceSummary() {
        return ResponseEntity.ok(aggregationService.buildGovernanceSummary());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPECIFIC REPORT ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    /** Citizen registration stats — ADMIN only */
    @GetMapping("/citizens")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCitizenReport() {
        long count = aggregationService.fetchCitizenCount();
        if (count < 0) {
            return ResponseEntity.ok(Map.of(
                "status", "unavailable",
                "message", "citizen-service is temporarily unreachable"
            ));
        }
        return ResponseEntity.ok(Map.of(
            "totalCitizens", count,
            "dataSource", "citizen-service"
        ));
    }

    /** Grievance analytics — reshapes grievance dashboard stats — ADMIN only */
    @GetMapping("/grievances")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getGrievanceReport() {
        Map<String, Object> stats = aggregationService.fetchGrievanceStats();
        if (stats == null) {
            return ResponseEntity.ok(Map.of("status", "unavailable",
                "message", "grievance-service is temporarily unreachable"));
        }
        List<Map<String, Object>> overdue = aggregationService.fetchOverdueComplaints();
        stats.put("overdueCount", overdue.size());
        stats.put("overdueComplaints", overdue);
        return ResponseEntity.ok(stats);
    }

    /** Revenue report — pass-through of service-management revenue summary — ADMIN + FINANCE_OFFICER */
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE_OFFICER')")
    public ResponseEntity<Map<String, Object>> getRevenueReport() {
        Map<String, Object> revenue = aggregationService.fetchRevenueSummary();
        if (revenue == null) {
            return ResponseEntity.ok(Map.of("status", "unavailable",
                "message", "service-management-service is temporarily unreachable"));
        }
        return ResponseEntity.ok(revenue);
    }

    /** Department performance standalone view — ADMIN only */
    @GetMapping("/performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPerformanceReport() {
        GovernanceSummary summary = aggregationService.buildGovernanceSummary();
        return ResponseEntity.ok(Map.of(
            "departmentPerformance", summary.getDepartmentPerformance() != null
                ? summary.getDepartmentPerformance() : Map.of(),
            "overallResolutionRate", summary.getOverallResolutionRate(),
            "grievanceDataUnavailable", summary.isGrievanceDataUnavailable()
        ));
    }
}
