package com.civicpulse.servicemanagement.service;

import com.civicpulse.servicemanagement.dto.*;
import com.civicpulse.servicemanagement.entity.*;
import com.civicpulse.servicemanagement.event.ApplicationEvent;
import com.civicpulse.servicemanagement.repository.ApplicationHistoryRepository;
import com.civicpulse.servicemanagement.repository.ApplicationRepository;
import com.civicpulse.servicemanagement.repository.DepartmentOfficerRepository;
import com.civicpulse.servicemanagement.util.*;
import com.civicpulse.servicemanagement.exception.DuplicateApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Optional;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class ApplicationService {
    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository repo;
    private final ApplicationHistoryRepository historyRepo;
    private final DepartmentOfficerRepository departmentOfficerRepo;
    private final ApplicationNumberGenerator appNumberGen;
    private final CertificateNumberGenerator certNumberGen;
    private final KafkaTemplate<String, ApplicationEvent> kafkaTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Legal status transitions
    private static final Map<ApplicationStatus, EnumSet<ApplicationStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(ApplicationStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(ApplicationStatus.SUBMITTED,
                EnumSet.of(ApplicationStatus.UNDER_VERIFICATION));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.UNDER_VERIFICATION,
                EnumSet.of(ApplicationStatus.VERIFIED, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.VERIFIED,
                EnumSet.of(ApplicationStatus.APPROVED, ApplicationStatus.REJECTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.APPROVED,
                EnumSet.of(ApplicationStatus.CERTIFICATE_GENERATED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.CERTIFICATE_GENERATED,
                EnumSet.of(ApplicationStatus.DOWNLOADED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.DOWNLOADED,
                EnumSet.of(ApplicationStatus.DOWNLOADED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.REJECTED,
                EnumSet.of(ApplicationStatus.RESUBMITTED));
        ALLOWED_TRANSITIONS.put(ApplicationStatus.RESUBMITTED,
                EnumSet.of(ApplicationStatus.UNDER_VERIFICATION));
    }

    private static final Map<ServiceType, List<String>> REQUIRED_DOCS = new EnumMap<>(ServiceType.class);

    // Fee schedule (in INR) — 0 for free certificates, non-zero for paid services
    private static final Map<ServiceType, BigDecimal> FEE_SCHEDULE = new EnumMap<>(ServiceType.class);

    static {
        REQUIRED_DOCS.put(ServiceType.BIRTH_CERTIFICATE, Arrays.asList("Hospital Birth Record", "Parent Aadhaar Card", "Address Proof"));
        REQUIRED_DOCS.put(ServiceType.DEATH_CERTIFICATE, Arrays.asList("Hospital Death Certificate", "Applicant Aadhaar", "Address Proof"));
        REQUIRED_DOCS.put(ServiceType.INCOME_CERTIFICATE, Arrays.asList("Aadhaar Card", "Salary Slip OR Income Proof", "Bank Statement", "Ration Card"));
        REQUIRED_DOCS.put(ServiceType.RESIDENCE_CERTIFICATE, Arrays.asList("Aadhaar Card", "Electricity Bill", "Rental Agreement OR Property Tax Receipt"));
        REQUIRED_DOCS.put(ServiceType.TRADE_LICENSE, Arrays.asList("GST Certificate", "Shop Photograph", "Owner Aadhaar", "Address Proof"));
        REQUIRED_DOCS.put(ServiceType.PERMIT_APPROVAL, Arrays.asList("Aadhaar Card", "Property/Location Proof"));

        // Fee schedule matching frontend config
        FEE_SCHEDULE.put(ServiceType.BIRTH_CERTIFICATE,   BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.DEATH_CERTIFICATE,   BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.INCOME_CERTIFICATE,  new BigDecimal("20"));
        FEE_SCHEDULE.put(ServiceType.RESIDENCE_CERTIFICATE, new BigDecimal("20"));
        FEE_SCHEDULE.put(ServiceType.TRADE_LICENSE,       new BigDecimal("500"));
        FEE_SCHEDULE.put(ServiceType.PERMIT_APPROVAL,     BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.COMMUNITY_CERTIFICATE, BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.BUILDING_PERMIT,     BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.ROAD_CUTTING_PERMIT, BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.WATER_CONNECTION_PERMIT, BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.ELECTRICITY_CONNECTION_PERMIT, BigDecimal.ZERO);
        FEE_SCHEDULE.put(ServiceType.PUBLIC_EVENT_PERMIT, BigDecimal.ZERO);
    }

    public ApplicationService(ApplicationRepository repo,
                              ApplicationHistoryRepository historyRepo,
                              DepartmentOfficerRepository departmentOfficerRepo,
                              ApplicationNumberGenerator appNumberGen,
                              CertificateNumberGenerator certNumberGen,
                              KafkaTemplate<String, ApplicationEvent> kafkaTemplate) {
        this.repo = repo;
        this.historyRepo = historyRepo;
        this.departmentOfficerRepo = departmentOfficerRepo;
        this.appNumberGen = appNumberGen;
        this.certNumberGen = certNumberGen;
        this.kafkaTemplate = kafkaTemplate;
    }

    private String getDepartmentForServiceType(ServiceType serviceType) {
        return switch (serviceType) {
            case BIRTH_CERTIFICATE, DEATH_CERTIFICATE -> "Health Department";
            case INCOME_CERTIFICATE, RESIDENCE_CERTIFICATE, COMMUNITY_CERTIFICATE -> "Revenue Department";
            case TRADE_LICENSE, PUBLIC_EVENT_PERMIT -> "Municipal Corporation";
            case BUILDING_PERMIT, PERMIT_APPROVAL -> "Urban Planning Department";
            case ROAD_CUTTING_PERMIT -> "Roads Department";
            case WATER_CONNECTION_PERMIT -> "Water Department";
            case ELECTRICITY_CONNECTION_PERMIT -> "Electricity Department";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CITIZEN: Submit Application
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication submitApplication(ApplicationRequest request) {
        // Enforce Single Active Application Rule
        List<ApplicationStatus> activeStatuses = Arrays.asList(
                ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_VERIFICATION, 
                ApplicationStatus.VERIFIED, ApplicationStatus.APPROVED
        );
        Optional<ServiceApplication> existing = repo.findFirstByServiceTypeAndAadhaarNumberAndStatusIn(
                request.getServiceType(), request.getAadhaarNumber(), activeStatuses
        );
        if (existing.isPresent()) {
            throw new DuplicateApplicationException("You already have an active application for this certificate.", existing.get());
        }

        // Validate required documents
        List<String> requiredDocs = REQUIRED_DOCS.get(request.getServiceType());
        if (requiredDocs != null && !requiredDocs.isEmpty()) {
            if (request.getDocumentsSubmitted() == null || request.getDocumentsSubmitted().trim().isEmpty()) {
                throw new IllegalArgumentException("Missing required documents. Required: " + requiredDocs);
            }
            try {
                List<String> submittedDocs = objectMapper.readValue(request.getDocumentsSubmitted(), new TypeReference<List<String>>() {});
                for (String doc : requiredDocs) {
                    if (!submittedDocs.contains(doc)) {
                        throw new IllegalArgumentException("Missing required document: " + doc);
                    }
                }
            } catch (JsonProcessingException e) {
                String submittedDocsStr = request.getDocumentsSubmitted();
                for (String doc : requiredDocs) {
                    if (!submittedDocsStr.contains(doc)) {
                        throw new IllegalArgumentException("Missing required document: " + doc);
                    }
                }
            }
        }

        String dynamicDataJson = null;
        if (request.getDynamicData() != null) {
            try {
                dynamicDataJson = objectMapper.writeValueAsString(request.getDynamicData());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize dynamicData for application", e);
            }
        }

        ServiceApplication app = ServiceApplication.builder()
            .applicationNumber(appNumberGen.generate())
            .citizenId(request.getCitizenId())
            .serviceType(request.getServiceType())
            .applicantName(request.getApplicantName())
            .aadhaarNumber(request.getAadhaarNumber())
            .documentsSubmitted(request.getDocumentsSubmitted())
            .dynamicData(dynamicDataJson)
            .status(ApplicationStatus.SUBMITTED)
            .department(getDepartmentForServiceType(request.getServiceType()))
            .downloadCount(0)
            .feeAmount(FEE_SCHEDULE.getOrDefault(request.getServiceType(), BigDecimal.ZERO))
            .feeCollected(false)
            .build();

        ServiceApplication saved = repo.save(app);
        logHistory(saved.getApplicationId(), null, ApplicationStatus.SUBMITTED.name(), "Application submitted successfully");
        publishEvent("certificate-submitted", saved, "Application submitted");
        log.info("Application submitted: {}", saved.getApplicationNumber());
        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CITIZEN: Resubmit Application
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication resubmitApplication(UUID id, ApplicationRequest request) {
        ServiceApplication app = getOrThrow(id);
        validateTransition(app.getStatus(), ApplicationStatus.RESUBMITTED);
        
        String prevStatus = app.getStatus().name();
        app.setDocumentsSubmitted(request.getDocumentsSubmitted());
        app.setRejectionReason(null);
        app.setOfficerRemarks(null);
        
        if (request.getDynamicData() != null) {
            try {
                app.setDynamicData(objectMapper.writeValueAsString(request.getDynamicData()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize dynamicData for resubmission", e);
            }
        }
        
        app.setStatus(ApplicationStatus.RESUBMITTED);
        ServiceApplication saved = repo.save(app);
        
        logHistory(saved.getApplicationId(), prevStatus, ApplicationStatus.RESUBMITTED.name(), "Application resubmitted with corrected documents");
        publishEvent("application-resubmitted", saved, "Application resubmitted");
        
        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OFFICER: Verify Documents
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication verifyApplication(UUID id, VerifyRequest request, String officerName) {
        ServiceApplication app = getOrThrow(id);

        if (app.getStatus() == ApplicationStatus.SUBMITTED || app.getStatus() == ApplicationStatus.RESUBMITTED) {
            validateTransition(app.getStatus(), ApplicationStatus.UNDER_VERIFICATION);
            String oldStatus = app.getStatus().name();
            app.setStatus(ApplicationStatus.UNDER_VERIFICATION);
            logHistory(app.getApplicationId(), oldStatus, ApplicationStatus.UNDER_VERIFICATION.name(), "Verification process started by " + officerName);
        }

        ApplicationStatus targetStatus = request.isVerified() ? ApplicationStatus.VERIFIED : ApplicationStatus.REJECTED;
        validateTransition(app.getStatus(), targetStatus);

        String previousStatus = app.getStatus().name();
        app.setStatus(targetStatus);
        app.setVerifiedDate(LocalDateTime.now());

        if (request.isVerified()) {
            ServiceApplication saved = repo.save(app);
            logHistory(saved.getApplicationId(), previousStatus, targetStatus.name(), "Documents verified by " + officerName + ". Remarks: " + request.getRemarks());
            publishEvent("application-under-verification", saved, "Documents verified successfully");
            return saved;
        } else {
            app.setRejectionReason(request.getRemarks() != null && !request.getRemarks().isBlank() ? request.getRemarks() : "Document verification failed");
            ServiceApplication saved = repo.save(app);
            logHistory(saved.getApplicationId(), previousStatus, targetStatus.name(), "Documents rejected by " + officerName + ". Reason: " + app.getRejectionReason());
            publishEvent("additional-information-requested", saved, app.getRejectionReason());
            return saved;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OFFICER: Approve Application & Auto-Generate Certificate
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication approveApplication(UUID id, String officerUsername, String remarks) {
        ServiceApplication app = getOrThrow(id);

        if (app.getStatus() == ApplicationStatus.SUBMITTED || app.getStatus() == ApplicationStatus.RESUBMITTED) {
            validateTransition(app.getStatus(), ApplicationStatus.UNDER_VERIFICATION);
            String oldStatus = app.getStatus().name();
            app.setStatus(ApplicationStatus.UNDER_VERIFICATION);
            logHistory(app.getApplicationId(), oldStatus, ApplicationStatus.UNDER_VERIFICATION.name(), "Verification process started by " + officerUsername);
        }

        validateTransition(app.getStatus(), ApplicationStatus.APPROVED);
        String status1 = app.getStatus().name();
        
        // Fetch officer details
        String fullName = officerUsername;
        String dept = app.getDepartment();
        java.util.Optional<com.civicpulse.servicemanagement.entity.DepartmentOfficer> officerOpt = departmentOfficerRepo.findByUsername(officerUsername);
        if (officerOpt.isPresent()) {
            fullName = officerOpt.get().getOfficerName();
            dept = officerOpt.get().getDepartment();
        }
        
        app.setStatus(ApplicationStatus.APPROVED);
        app.setApprovedDate(LocalDateTime.now());
        app.setApprovedBy(fullName);
        app.setDigitallySignedBy(fullName);
        app.setDepartment(dept);
        
        String verificationId = "CVP-DS-" + java.time.Year.now().getValue() + "-" + app.getApplicationId().toString().substring(0, 8).toUpperCase();
        app.setDigitalSignature(verificationId);
        
        if (remarks != null && !remarks.trim().isEmpty()) {
            app.setOfficerRemarks(remarks);
        }
        
        logHistory(app.getApplicationId(), status1, ApplicationStatus.APPROVED.name(), "Approved and digitally signed by " + fullName);
        publishEvent("certificate-approved", app, "Application approved by " + fullName);

        validateTransition(app.getStatus(), ApplicationStatus.CERTIFICATE_GENERATED);
        String status2 = app.getStatus().name();

        String certNumber = certNumberGen.generate(app.getServiceType());
        app.setCertificateNumber(certNumber);
        app.setStatus(ApplicationStatus.CERTIFICATE_GENERATED);
        app.setDigitallySignedBy("Officer: " + officerUsername + ", Municipal Authority");
        // Mark fee as collected at point of certificate issuance (simulates payment)
        app.setFeeCollected(true);

        app.setDigitalSignature(
            "Digitally Signed by Municipal Officer — " + officerUsername +
            " | Date: " + LocalDateTime.now() +
            " | Cert No: " + certNumber
        );

        ServiceApplication saved = repo.save(app);
        logHistory(saved.getApplicationId(), status2, ApplicationStatus.CERTIFICATE_GENERATED.name(), "Certificate " + certNumber + " generated");
        publishEvent("certificate-generated", saved, "Certificate " + certNumber + " generated");
        log.info("Certificate generated: {}", certNumber);
        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OFFICER: Reject Application
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication rejectApplication(UUID id, RejectRequest request, String officerName) {
        ServiceApplication app = getOrThrow(id);

        if (app.getStatus() == ApplicationStatus.SUBMITTED || app.getStatus() == ApplicationStatus.RESUBMITTED) {
            app.setStatus(ApplicationStatus.UNDER_VERIFICATION);
        }

        validateTransition(app.getStatus(), ApplicationStatus.REJECTED);
        String previousStatus = app.getStatus().name();

        app.setStatus(ApplicationStatus.REJECTED);
        app.setRejectionReason(request.getReason() != null && !request.getReason().isBlank() ? request.getReason() : "Documents Missing");
        app.setOfficerRemarks(request.getOfficerRemarks() != null ? request.getOfficerRemarks() : "");

        ServiceApplication saved = repo.save(app);
        logHistory(saved.getApplicationId(), previousStatus, ApplicationStatus.REJECTED.name(), "Rejected by " + officerName + ". Reason: " + app.getRejectionReason());
        publishEvent("certificate-rejected", saved, app.getRejectionReason());
        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CITIZEN: Download Certificate
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public ServiceApplication recordDownload(UUID id) {
        ServiceApplication app = getOrThrow(id);

        validateTransition(app.getStatus(), ApplicationStatus.DOWNLOADED);
        String previousStatus = app.getStatus().name();

        app.setStatus(ApplicationStatus.DOWNLOADED);
        app.setDownloadCount(app.getDownloadCount() + 1);

        ServiceApplication saved = repo.save(app);
        logHistory(saved.getApplicationId(), previousStatus, ApplicationStatus.DOWNLOADED.name(), "Certificate downloaded (Count: " + saved.getDownloadCount() + ")");
        publishEvent("certificate-downloaded", saved, "Certificate downloaded (Count: " + saved.getDownloadCount() + ")");
        return saved;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUERIES
    // ─────────────────────────────────────────────────────────────────────────
    public ServiceApplication getById(UUID id) { return getOrThrow(id); }

    public List<ServiceApplication> getByCitizenId(String citizenId) {
        return repo.findByCitizenId(citizenId);
    }

    public List<ServiceApplication> getAll() { return repo.findAll(); }

    public List<ServiceApplication> getByStatus(String status) {
        return repo.findByStatus(ApplicationStatus.valueOf(status.toUpperCase()));
    }

    public List<ServiceApplication> getByType(String type) {
        return repo.findByServiceType(ServiceType.valueOf(type.toUpperCase()));
    }

    public List<ServiceApplication> getPendingForVerification(String officerUsername) {
        Optional<DepartmentOfficer> officer = departmentOfficerRepo.findByUsername(officerUsername);
        if (officer.isEmpty()) {
            return repo.findAll().stream()
                    .filter(app -> app.getStatus() == ApplicationStatus.SUBMITTED || 
                                   app.getStatus() == ApplicationStatus.UNDER_VERIFICATION ||
                                   app.getStatus() == ApplicationStatus.RESUBMITTED)
                    .toList();
        }
        String department = officer.get().getDepartment();
        return repo.findByDepartmentOrderByAppliedDateDesc(department).stream()
                .filter(app -> app.getStatus() == ApplicationStatus.SUBMITTED || 
                               app.getStatus() == ApplicationStatus.UNDER_VERIFICATION ||
                               app.getStatus() == ApplicationStatus.RESUBMITTED)
                .toList();
    }
    
    public List<ServiceApplication> getOfficerApplicationsByStatus(String officerUsername, ApplicationStatus status) {
        Optional<DepartmentOfficer> officer = departmentOfficerRepo.findByUsername(officerUsername);
        if (officer.isEmpty()) {
            return repo.findByStatus(status);
        }
        return repo.findByDepartmentOrderByAppliedDateDesc(officer.get().getDepartment()).stream()
                .filter(app -> app.getStatus() == status)
                .toList();
    }
    
    public List<ServiceApplication> getOfficerRecentApplications(String officerUsername) {
        Optional<DepartmentOfficer> officer = departmentOfficerRepo.findByUsername(officerUsername);
        if (officer.isEmpty()) {
            return repo.findAll();
        }
        return repo.findByDepartmentOrderByAppliedDateDesc(officer.get().getDepartment());
    }

    public List<ApplicationHistory> getHistory(UUID applicationId) {
        return historyRepo.findByApplicationIdOrderByTimestampAsc(applicationId);
    }

    public AdminStatsResponse getStats() {
        List<ServiceApplication> all = repo.findAll();

        long total = all.size();
        long pending = all.stream().filter(app -> app.getStatus() == ApplicationStatus.SUBMITTED).count();
        long underVerification = all.stream().filter(app -> app.getStatus() == ApplicationStatus.UNDER_VERIFICATION).count();
        long approved = all.stream().filter(app -> app.getStatus() == ApplicationStatus.APPROVED).count();
        long rejected = all.stream().filter(app -> app.getStatus() == ApplicationStatus.REJECTED).count();
        long certificatesIssued = all.stream().filter(app -> app.getStatus() == ApplicationStatus.CERTIFICATE_GENERATED).count();
        long downloaded = all.stream().filter(app -> app.getStatus() == ApplicationStatus.DOWNLOADED).count();

        return AdminStatsResponse.builder()
            .totalApplications(total)
            .pending(pending)
            .underVerification(underVerification)
            .approved(approved)
            .rejected(rejected)
            .certificatesIssued(certificatesIssued + downloaded)
            .downloaded(downloaded)
            .build();
    }

    public AdminStatsResponse getOfficerStats(String officerUsername) {
        Optional<DepartmentOfficer> officer = departmentOfficerRepo.findByUsername(officerUsername);
        if (officer.isEmpty()) {
            return getStats();
        }
        List<ServiceApplication> all = repo.findByDepartment(officer.get().getDepartment());
        
        long total = all.size();
        long pending = all.stream().filter(app -> app.getStatus() == ApplicationStatus.SUBMITTED || app.getStatus() == ApplicationStatus.RESUBMITTED).count();
        long underVerification = all.stream().filter(app -> app.getStatus() == ApplicationStatus.UNDER_VERIFICATION).count();
        long approved = all.stream().filter(app -> app.getStatus() == ApplicationStatus.APPROVED || app.getStatus() == ApplicationStatus.CERTIFICATE_GENERATED || app.getStatus() == ApplicationStatus.DOWNLOADED).count();
        long rejected = all.stream().filter(app -> app.getStatus() == ApplicationStatus.REJECTED).count();
        
        return AdminStatsResponse.builder()
            .totalApplications(total)
            .pending(pending)
            .underVerification(underVerification)
            .approved(approved)
            .rejected(rejected)
            .certificatesIssued(0)
            .downloaded(0)
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REVENUE SUMMARY — aggregate fee data for ADMIN/COMMISSIONER/FINANCE_OFFICER
    // ─────────────────────────────────────────────────────────────────────────
    public RevenueSummaryResponse getRevenueSummary() {
        List<ServiceApplication> collected = repo.findByFeeCollectedTrue();
        BigDecimal total = collected.stream()
                .map(app -> app.getFeeAmount() != null ? app.getFeeAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> byType = new java.util.LinkedHashMap<>();
        for (ServiceApplication app : collected) {
            String type = app.getServiceType().name();
            byType.merge(type, app.getFeeAmount() != null ? app.getFeeAmount() : BigDecimal.ZERO, BigDecimal::add);
        }

        return new RevenueSummaryResponse(total, byType, collected.size());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD STATS — mirrors grievance-service pattern for reporting-service
    // ─────────────────────────────────────────────────────────────────────────
    public Map<String, Object> getServiceDashboardStats() {
        List<ServiceApplication> all = repo.findAll();
        long total = all.size();
        long pending = all.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED || a.getStatus() == ApplicationStatus.RESUBMITTED).count();
        long underVerification = all.stream().filter(a -> a.getStatus() == ApplicationStatus.UNDER_VERIFICATION).count();
        long approved = all.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
        long certGenerated = all.stream().filter(a -> a.getStatus() == ApplicationStatus.CERTIFICATE_GENERATED).count();
        long downloaded = all.stream().filter(a -> a.getStatus() == ApplicationStatus.DOWNLOADED).count();
        long rejected = all.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        long completed = certGenerated + downloaded;
        double resolutionRate = total == 0 ? 0.0 : (double) completed / total * 100;

        // Group by service type
        Map<String, Long> byType = new java.util.LinkedHashMap<>();
        for (ServiceType st : ServiceType.values()) {
            long count = all.stream().filter(a -> a.getServiceType() == st).count();
            if (count > 0) byType.put(st.name(), count);
        }

        // Group by status
        Map<String, Long> byStatus = Map.of(
            "SUBMITTED", pending,
            "UNDER_VERIFICATION", underVerification,
            "APPROVED", approved,
            "CERTIFICATE_GENERATED", certGenerated,
            "DOWNLOADED", downloaded,
            "REJECTED", rejected
        );

        // Group by department
        Map<String, Long> byDepartment = new java.util.LinkedHashMap<>();
        all.forEach(a -> {
            if (a.getDepartment() != null) {
                byDepartment.merge(a.getDepartment(), 1L, Long::sum);
            }
        });

        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalApplications", total);
        stats.put("certificatesIssued", completed);
        stats.put("pending", pending);
        stats.put("rejected", rejected);
        stats.put("resolutionRate", Math.round(resolutionRate * 100.0) / 100.0);
        stats.put("byServiceType", byType);
        stats.put("byStatus", byStatus);
        stats.put("byDepartment", byDepartment);
        return stats;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private ServiceApplication getOrThrow(UUID id) {
        return repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Application not found: " + id));
    }

    private void validateTransition(ApplicationStatus current, ApplicationStatus next) {
        if (current == ApplicationStatus.DOWNLOADED && next == ApplicationStatus.DOWNLOADED) {
            return;
        }
        EnumSet<ApplicationStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(
                current, EnumSet.noneOf(ApplicationStatus.class));

        if (!allowed.contains(next)) {
            throw new IllegalStateException(
                "Invalid status transition: cannot move from [" + current + "] to [" + next + "]. " +
                "Allowed transitions from " + current + ": " + allowed);
        }
    }

    private void logHistory(UUID applicationId, String previousStatus, String newStatus, String remarks) {
        ApplicationHistory entry = new ApplicationHistory(applicationId, previousStatus, newStatus, remarks);
        historyRepo.save(entry);
    }

    private void publishEvent(String eventType, ServiceApplication app, String remarks) {
        try {
            ApplicationEvent event = new ApplicationEvent(
                eventType,
                app.getApplicationId(),
                app.getApplicationNumber(),
                app.getCitizenId(),
                app.getServiceType().name(),
                app.getApplicantName(),
                app.getStatus().name(),
                app.getDepartment(),
                remarks,
                LocalDateTime.now()
            );
            kafkaTemplate.send(toTopicName(eventType), app.getApplicationNumber(), event);
            log.info("Kafka event published: {} → {} (applicationId: {})", eventType, app.getApplicationNumber(), app.getApplicationId());
        } catch (Exception e) {
            log.error("Failed to publish Kafka event: {}", e.getMessage(), e);
        }
    }

    private String toTopicName(String eventType) {
        return eventType;
    }
}
