package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.FundDisbursement;
import com.civicpulse.welfare_service.entity.PaymentMode;
import com.civicpulse.welfare_service.entity.PaymentStatus;
import com.civicpulse.welfare_service.service.FundDisbursementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/welfare/disbursements")
public class FundDisbursementController {

    private final FundDisbursementService disbursementService;

    public FundDisbursementController(FundDisbursementService disbursementService) {
        this.disbursementService = disbursementService;
    }

    // POST /api/welfare/disbursements
    @PostMapping
    public ResponseEntity<FundDisbursement> disburse(@RequestBody Map<String, Object> body,
                                                      @AuthenticationPrincipal Jwt jwt) {
        UUID beneficiaryId = UUID.fromString(body.get("beneficiaryId").toString());
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        PaymentMode paymentMode = PaymentMode.valueOf(body.get("paymentMode").toString());
        String approvedBy = jwt != null ? jwt.getClaim("preferred_username") : "SYSTEM";

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(disbursementService.disburse(beneficiaryId, amount, paymentMode, approvedBy));
    }

    // GET /api/welfare/disbursements
    @GetMapping
    public ResponseEntity<List<FundDisbursement>> getAll(
            @RequestParam(required = false) UUID schemeId,
            @RequestParam(required = false) String status) {
        if (schemeId != null) {
            return ResponseEntity.ok(disbursementService.getBySchemeId(schemeId));
        }
        if (status != null) {
            return ResponseEntity.ok(disbursementService.getByStatus(PaymentStatus.valueOf(status)));
        }
        return ResponseEntity.ok(disbursementService.getAll());
    }

    // GET /api/welfare/disbursements/beneficiary/{beneficiaryId}
    @GetMapping("/beneficiary/{beneficiaryId}")
    public ResponseEntity<List<FundDisbursement>> getByBeneficiary(@PathVariable UUID beneficiaryId) {
        return ResponseEntity.ok(disbursementService.getByBeneficiaryId(beneficiaryId));
    }
}
