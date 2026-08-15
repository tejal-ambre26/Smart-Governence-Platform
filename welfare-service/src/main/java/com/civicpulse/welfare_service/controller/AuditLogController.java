package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.AuditLog;
import com.civicpulse.welfare_service.repository.AuditLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/welfare/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepo;

    public AuditLogController(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogRepo.findAll());
    }
}
