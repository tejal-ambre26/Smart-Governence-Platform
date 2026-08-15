package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.PaymentReceipt;
import com.civicpulse.welfare_service.repository.PaymentReceiptRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/welfare/receipts")
public class PaymentReceiptController {

    private final PaymentReceiptRepository receiptRepo;

    public PaymentReceiptController(PaymentReceiptRepository receiptRepo) {
        this.receiptRepo = receiptRepo;
    }

    @GetMapping("/beneficiary/{beneficiaryId}")
    public ResponseEntity<PaymentReceipt> getReceiptByBeneficiary(@PathVariable UUID beneficiaryId) {
        return receiptRepo.findByBeneficiaryId(beneficiaryId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<PaymentReceipt> getReceiptByTransaction(@PathVariable String transactionId) {
        return receiptRepo.findByTransactionId(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
