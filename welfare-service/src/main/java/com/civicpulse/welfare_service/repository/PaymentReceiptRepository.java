package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.PaymentReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentReceiptRepository extends JpaRepository<PaymentReceipt, UUID> {
    Optional<PaymentReceipt> findByReceiptNumber(String receiptNumber);
    Optional<PaymentReceipt> findByTransactionId(String transactionId);
    Optional<PaymentReceipt> findByBeneficiaryId(UUID beneficiaryId);
}
