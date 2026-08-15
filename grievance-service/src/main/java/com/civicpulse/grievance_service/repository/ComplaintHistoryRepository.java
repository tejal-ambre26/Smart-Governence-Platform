package com.civicpulse.grievance_service.repository;

import com.civicpulse.grievance_service.entity.ComplaintHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ComplaintHistoryRepository extends JpaRepository<ComplaintHistory, UUID> {
    List<ComplaintHistory> findByComplaintIdOrderByTimestampAsc(UUID complaintId);
}
