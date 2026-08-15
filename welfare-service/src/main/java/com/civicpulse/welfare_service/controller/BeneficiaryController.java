package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.Beneficiary;
import com.civicpulse.welfare_service.entity.BeneficiaryHistory;
import com.civicpulse.welfare_service.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/welfare")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    // POST /api/welfare/schemes/{schemeId}/apply (Submit Application)
    @PostMapping("/schemes/{schemeId}/apply")
    public ResponseEntity<Beneficiary> apply(@PathVariable UUID schemeId,
                                              @Valid @RequestBody Beneficiary beneficiary) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                beneficiaryService.apply(schemeId, beneficiary));
    }

    // POST /api/welfare/beneficiaries/draft (Save Draft)
    @PostMapping("/beneficiaries/draft")
    public ResponseEntity<Beneficiary> saveDraft(@RequestBody Beneficiary beneficiary) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                beneficiaryService.saveDraft(beneficiary));
    }

    // PUT /api/welfare/beneficiaries/{id}/draft (Update Draft)
    @PutMapping("/beneficiaries/{id}/draft")
    public ResponseEntity<Beneficiary> updateDraft(@PathVariable UUID id,
                                                    @RequestBody Beneficiary beneficiary) {
        return ResponseEntity.ok(beneficiaryService.updateDraft(id, beneficiary));
    }

    // DELETE /api/welfare/beneficiaries/{id}/draft (Delete Draft)
    @DeleteMapping("/beneficiaries/{id}/draft")
    public ResponseEntity<Void> deleteDraft(@PathVariable UUID id,
                                             @RequestParam String citizenId) {
        beneficiaryService.deleteDraft(id, citizenId);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/welfare/beneficiaries/{id} (Delete specific application from DB)
    @DeleteMapping("/beneficiaries/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable UUID id) {
        beneficiaryService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/welfare/beneficiaries/reset-all (Delete all applications from DB)
    @DeleteMapping("/beneficiaries/reset-all")
    public ResponseEntity<Map<String, String>> resetAll() {
        beneficiaryService.deleteAllApplications();
        return ResponseEntity.ok(Map.of("message", "All welfare applications deleted cleanly from database."));
    }

    // PUT /api/welfare/beneficiaries/{id}/withdraw (Citizen Withdraw)
    @PutMapping("/beneficiaries/{id}/withdraw")
    public ResponseEntity<Beneficiary> withdraw(@PathVariable UUID id,
                                                 @RequestParam String citizenId) {
        return ResponseEntity.ok(beneficiaryService.withdrawApplication(id, citizenId));
    }

    // PUT /api/welfare/beneficiaries/{id}/start-verification & /review
    @PutMapping({"/beneficiaries/{id}/start-verification", "/beneficiaries/{id}/review"})
    public ResponseEntity<Beneficiary> startVerification(@PathVariable UUID id,
                                                          @RequestBody(required = false) Map<String, String> body) {
        String officer = body != null ? body.get("officerUsername") : "officer";
        return ResponseEntity.ok(beneficiaryService.startVerification(id, officer));
    }

    // PUT /api/welfare/beneficiaries/{id}/bank-verify (Officer Bank Verification)
    @PutMapping("/beneficiaries/{id}/bank-verify")
    public ResponseEntity<Beneficiary> bankVerify(@PathVariable UUID id,
                                                   @RequestBody Map<String, Object> body) {
        boolean matches = Boolean.TRUE.equals(body.get("matches"));
        String officer = (String) body.get("officerUsername");
        String remarks = (String) body.get("remarks");
        return ResponseEntity.ok(beneficiaryService.verifyBankDetails(id, matches, officer, remarks));
    }

    // GET /api/welfare/beneficiaries/citizen/{citizenId}
    @GetMapping("/beneficiaries/citizen/{citizenId}")
    public ResponseEntity<List<Beneficiary>> getByCitizen(@PathVariable String citizenId) {
        return ResponseEntity.ok(beneficiaryService.getByCitizenId(citizenId));
    }

    // GET /api/welfare/beneficiaries/department/{departmentName}
    @GetMapping("/beneficiaries/department/{departmentName}")
    public ResponseEntity<List<Beneficiary>> getByDepartment(@PathVariable String departmentName) {
        return ResponseEntity.ok(beneficiaryService.getByDepartment(departmentName));
    }

    // GET /api/welfare/beneficiaries/officer/{username}
    @GetMapping("/beneficiaries/officer/{username}")
    public ResponseEntity<List<Beneficiary>> getByOfficer(@PathVariable String username) {
        String dept = "Education Department";
        if ("david".equalsIgnoreCase(username)) {
            dept = "Social Welfare Department";
        } else if ("john".equalsIgnoreCase(username)) {
            dept = "Health Department";
        } else if ("emily".equalsIgnoreCase(username)) {
            dept = "Education Department";
        }
        return ResponseEntity.ok(beneficiaryService.getByDepartment(dept));
    }

    // GET /api/welfare/beneficiaries/recommended (for Admin)
    @GetMapping("/beneficiaries/recommended")
    public ResponseEntity<List<Beneficiary>> getRecommended() {
        return ResponseEntity.ok(beneficiaryService.getRecommended());
    }

    // GET /api/welfare/beneficiaries/pending
    @GetMapping("/beneficiaries/pending")
    public ResponseEntity<List<Beneficiary>> getPending() {
        return ResponseEntity.ok(beneficiaryService.getPending());
    }

    // GET /api/welfare/beneficiaries/all
    @GetMapping("/beneficiaries/all")
    public ResponseEntity<List<Beneficiary>> getAll() {
        return ResponseEntity.ok(beneficiaryService.getAll());
    }

    // PUT /api/welfare/beneficiaries/{id}/recommend (Officer Action 1)
    @PutMapping("/beneficiaries/{id}/recommend")
    public ResponseEntity<Beneficiary> recommend(@PathVariable UUID id,
                                                  @RequestBody(required = false) Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : "Recommended for approval";
        String officer = body != null ? body.get("officerUsername") : "officer";
        return ResponseEntity.ok(beneficiaryService.recommendApproval(id, officer, remarks));
    }

    // PUT /api/welfare/beneficiaries/{id}/reject (Officer Action 2)
    @PutMapping("/beneficiaries/{id}/reject")
    public ResponseEntity<Beneficiary> reject(@PathVariable UUID id,
                                               @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "No rejection reason provided");
        String officer = body.get("officerUsername");
        return ResponseEntity.ok(beneficiaryService.reject(id, officer, reason));
    }

    // PUT /api/welfare/beneficiaries/{id}/request-docs (Officer Action 3)
    @PutMapping("/beneficiaries/{id}/request-docs")
    public ResponseEntity<Beneficiary> requestDocs(@PathVariable UUID id,
                                                    @RequestBody(required = false) Map<String, String> body) {
        String remarks = body != null ? body.get("remarks") : "Additional documents required for verification";
        String officer = body != null ? body.get("officerUsername") : "officer";
        return ResponseEntity.ok(beneficiaryService.requestAdditionalDocuments(id, officer, remarks));
    }

    // POST /api/welfare/beneficiaries/{id}/resubmit-docs (Citizen Resubmit Action)
    @PostMapping("/beneficiaries/{id}/resubmit-docs")
    public ResponseEntity<Beneficiary> resubmitDocs(@PathVariable UUID id,
                                                     @RequestBody Map<String, String> body) {
        String docs = body.getOrDefault("documentsSubmitted", "");
        String remarks = body.get("remarks");
        return ResponseEntity.ok(beneficiaryService.resubmitDocuments(id, docs, remarks));
    }

    // POST /api/welfare/beneficiaries/{id}/dbt (Admin Execute DBT)
    @PostMapping("/beneficiaries/{id}/dbt")
    public ResponseEntity<Beneficiary> executeDBT(@PathVariable UUID id,
                                                   @RequestBody(required = false) Map<String, String> body) {
        String admin = body != null ? body.get("adminUsername") : "admin_user";
        return ResponseEntity.ok(beneficiaryService.executeDBT(id, admin));
    }

    // PUT /api/welfare/beneficiaries/{id}/approve (Admin Approve Legacy)
    @PutMapping("/beneficiaries/{id}/approve")
    public ResponseEntity<Beneficiary> approve(@PathVariable UUID id,
                                                @RequestBody(required = false) Map<String, String> body) {
        String admin = body != null ? body.get("adminUsername") : "admin_user";
        return ResponseEntity.ok(beneficiaryService.executeDBT(id, admin));
    }

    // GET /api/welfare/beneficiaries/{id}/history
    @GetMapping("/beneficiaries/{id}/history")
    public ResponseEntity<List<BeneficiaryHistory>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(beneficiaryService.getHistory(id));
    }
}
