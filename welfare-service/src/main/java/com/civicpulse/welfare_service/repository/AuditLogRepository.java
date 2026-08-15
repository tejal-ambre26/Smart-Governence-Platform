package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByUsername(String username);
    List<AuditLog> findByAction(String action);
    List<AuditLog> findByEntityNameAndEntityId(String entityName, String entityId);
}
