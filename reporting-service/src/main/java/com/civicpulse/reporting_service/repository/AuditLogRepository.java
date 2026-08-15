package com.civicpulse.reporting_service.repository;

import com.civicpulse.reporting_service.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    // Paginated fetch with optional eventType and date-range filter
    @Query("SELECT a FROM AuditLog a WHERE " +
           "(CAST(:eventType AS text) IS NULL OR a.eventType = :eventType) AND " +
           "(CAST(:from AS timestamp) IS NULL OR a.receivedAt >= :from) AND " +
           "(CAST(:to AS timestamp) IS NULL OR a.receivedAt <= :to) " +
           "ORDER BY a.receivedAt DESC")
    Page<AuditLog> findFiltered(
            @Param("eventType") String eventType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    // Full trail for a single entity across all event types
    List<AuditLog> findByEntityIdOrderByReceivedAtAsc(String entityId);
}
