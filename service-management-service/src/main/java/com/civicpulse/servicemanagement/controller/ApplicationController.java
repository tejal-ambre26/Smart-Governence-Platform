package com.civicpulse.servicemanagement.controller;

import com.civicpulse.servicemanagement.dto.*;
import com.civicpulse.servicemanagement.entity.ApplicationHistory;
import com.civicpulse.servicemanagement.entity.ServiceApplication;
import com.civicpulse.servicemanagement.entity.ApplicationStatus;
import com.civicpulse.servicemanagement.service.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ApplicationController {

    private final ApplicationService applicationService;
    private final CertificateService certificateService;

    public ApplicationController(ApplicationService applicationService,
                                 CertificateService certificateService) {
        this.applicationService = applicationService;
        this.certificateService = certificateService;
    }

    // ─── CITIZEN ──────────────────────────────────────────────────────────────
    @PostMapping("/apply")
    public ResponseEntity<ServiceApplication> apply(
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(applicationService.submitApplication(request));
    }

    @PutMapping("/resubmit/{id}")
    public ResponseEntity<ServiceApplication> resubmit(
            @PathVariable UUID id,
            @Valid @RequestBody ApplicationRequest request) {
        return ResponseEntity.ok(applicationService.resubmitApplication(id, request));
    }

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<ServiceApplication>> getMyCases(
            @PathVariable String citizenId) {
        return ResponseEntity.ok(applicationService.getByCitizenId(citizenId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceApplication> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<ApplicationHistory>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getHistory(id));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable UUID id) {
        ServiceApplication app = applicationService.recordDownload(id);
        byte[] pdf = certificateService.generateCertificatePdf(app);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + app.getCertificateNumber() + ".pdf\"")
            .body(pdf);
    }

    // ─── OFFICER ──────────────────────────────────────────────────────────────
    @GetMapping("/officer/pending")
    public ResponseEntity<List<ServiceApplication>> getPending(@AuthenticationPrincipal Jwt jwt) {
        String officerUsername = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.getPendingForVerification(officerUsername));
    }

    @GetMapping("/officer/preview/{id}")
    public ResponseEntity<byte[]> previewCertificate(@PathVariable UUID id) {
        ServiceApplication app = applicationService.getById(id);
        byte[] pdf = certificateService.generateCertificatePdf(app, true);
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"preview.pdf\"")
            .body(pdf);
    }

    @GetMapping("/officer/status/{status}")
    public ResponseEntity<List<ServiceApplication>> getOfficerAppsByStatus(
            @PathVariable ApplicationStatus status,
            @AuthenticationPrincipal Jwt jwt) {
        String officerUsername = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.getOfficerApplicationsByStatus(officerUsername, status));
    }

    @GetMapping("/officer/recent")
    public ResponseEntity<List<ServiceApplication>> getOfficerRecentApps(@AuthenticationPrincipal Jwt jwt) {
        String officerUsername = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.getOfficerRecentApplications(officerUsername));
    }

    @GetMapping("/officer/stats")
    public ResponseEntity<AdminStatsResponse> getOfficerStats(@AuthenticationPrincipal Jwt jwt) {
        String officerUsername = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.getOfficerStats(officerUsername));
    }

    @PutMapping("/verify/{id}")
    public ResponseEntity<ServiceApplication> verify(
            @PathVariable UUID id,
            @Valid @RequestBody VerifyRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String officerName = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.verifyApplication(id, request, officerName));
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<ServiceApplication> approve(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> request,
            @AuthenticationPrincipal Jwt jwt) {
        String officerName = jwt.getClaimAsString("preferred_username");
        String remarks = (request != null) ? request.get("officerRemarks") : null;
        return ResponseEntity.ok(applicationService.approveApplication(id, officerName, remarks));
    }

    @PutMapping("/reject/{id}")
    public ResponseEntity<ServiceApplication> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String officerName = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(applicationService.rejectApplication(id, request, officerName));
    }

    // ─── ADMIN ────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<ServiceApplication>> getAll() {
        return ResponseEntity.ok(applicationService.getAll());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<ServiceApplication>> byStatus(@PathVariable String status) {
        return ResponseEntity.ok(applicationService.getByStatus(status));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<ServiceApplication>> byType(@PathVariable String type) {
        return ResponseEntity.ok(applicationService.getByType(type));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(applicationService.getStats());
    }

    // ─── REVENUE (ADMIN/COMMISSIONER/FINANCE_OFFICER) ──────────────────────────
    @GetMapping("/revenue/summary")
    @PreAuthorize("hasAnyRole('ADMIN','FINANCE_OFFICER')")
    public ResponseEntity<RevenueSummaryResponse> getRevenueSummary() {
        return ResponseEntity.ok(applicationService.getRevenueSummary());
    }

    // ─── DASHBOARD STATS (for reporting-service aggregation) ─────────────────
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(applicationService.getServiceDashboardStats());
    }
}
