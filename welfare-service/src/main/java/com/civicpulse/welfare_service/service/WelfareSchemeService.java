package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.entity.SchemeStatus;
import com.civicpulse.welfare_service.entity.WelfareScheme;
import com.civicpulse.welfare_service.repository.WelfareSchemeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

import com.civicpulse.welfare_service.entity.AuditLog;
import com.civicpulse.welfare_service.repository.AuditLogRepository;

@Service
public class WelfareSchemeService {

    private final WelfareSchemeRepository schemeRepo;
    private final WelfareEventPublisher eventPublisher;
    private final AuditLogRepository auditLogRepo;

    public WelfareSchemeService(WelfareSchemeRepository schemeRepo,
                                WelfareEventPublisher eventPublisher,
                                AuditLogRepository auditLogRepo) {
        this.schemeRepo = schemeRepo;
        this.eventPublisher = eventPublisher;
        this.auditLogRepo = auditLogRepo;
    }

    public WelfareScheme createScheme(WelfareScheme scheme) {
        WelfareScheme saved = schemeRepo.save(scheme);
        eventPublisher.publishSchemeCreated(saved);
        auditLogRepo.save(new AuditLog(
            "admin",
            "ROLE_ADMIN",
            "CREATE_SCHEME",
            "WelfareScheme",
            saved.getSchemeId().toString(),
            null,
            saved.getSchemeName(),
            "Created new welfare scheme in department: " + saved.getDepartment()
        ));
        return saved;
    }

    public List<WelfareScheme> getAllSchemes() {
        return schemeRepo.findAll();
    }

    public WelfareScheme getSchemeById(UUID id) {
        return schemeRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Scheme not found: " + id));
    }

    @Transactional
    public WelfareScheme updateScheme(UUID id, WelfareScheme updated) {
        WelfareScheme existing = getSchemeById(id);
        existing.setSchemeName(updated.getSchemeName());
        existing.setDepartment(updated.getDepartment());
        existing.setDescription(updated.getDescription());
        existing.setEligibilityCriteria(updated.getEligibilityCriteria());
        existing.setMinIncome(updated.getMinIncome());
        existing.setMaxIncome(updated.getMaxIncome());
        existing.setMinAge(updated.getMinAge());
        existing.setMaxAge(updated.getMaxAge());
        existing.setBudgetAllocated(updated.getBudgetAllocated());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        return schemeRepo.save(existing);
    }

    public List<WelfareScheme> getActiveSchemes() {
        return schemeRepo.findByStatus(SchemeStatus.ACTIVE);
    }
}
