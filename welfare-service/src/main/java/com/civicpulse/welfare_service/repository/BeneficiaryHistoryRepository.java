package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.BeneficiaryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BeneficiaryHistoryRepository extends JpaRepository<BeneficiaryHistory, UUID> {
    List<BeneficiaryHistory> findByBeneficiaryIdOrderByTimestampAsc(UUID beneficiaryId);
    void deleteByBeneficiaryId(UUID beneficiaryId);
}
