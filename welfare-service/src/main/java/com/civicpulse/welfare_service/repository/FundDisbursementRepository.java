package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.FundDisbursement;
import com.civicpulse.welfare_service.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface FundDisbursementRepository extends JpaRepository<FundDisbursement, UUID> {
    List<FundDisbursement> findBySchemeId(UUID schemeId);
    List<FundDisbursement> findByPaymentStatus(PaymentStatus paymentStatus);
    List<FundDisbursement> findByBeneficiaryId(UUID beneficiaryId);

    @Query("SELECT f FROM FundDisbursement f ORDER BY f.disbursedDate DESC LIMIT 10")
    List<FundDisbursement> findTop10ByOrderByDisbursedDateDesc();

    @Query("SELECT MAX(CAST(SUBSTRING(f.transactionId, 10) AS integer)) FROM FundDisbursement f WHERE f.transactionId LIKE CONCAT('TXN-', :year, '-%')")
    Long findMaxTransactionSequenceForYear(int year);
}
