package com.civicpulse.grievance_service.service;

import com.civicpulse.grievance_service.entity.Complaint;
import com.civicpulse.grievance_service.entity.Complaint.ComplaintStatus;
import com.civicpulse.grievance_service.entity.ComplaintHistory;
import com.civicpulse.grievance_service.entity.Officer;
import com.civicpulse.grievance_service.dto.DashboardStats;
import com.civicpulse.grievance_service.event.ComplaintEvent;
import com.civicpulse.grievance_service.repository.ComplaintHistoryRepository;
import com.civicpulse.grievance_service.repository.ComplaintRepository;
import com.civicpulse.grievance_service.repository.OfficerRepository;
import com.civicpulse.grievance_service.dto.NotificationEvent;
import com.civicpulse.grievance_service.exception.DuplicateApplicationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintService.class);

    private final ComplaintRepository complaintRepository;
    private final OfficerRepository officerRepository;
    private final ComplaintHistoryRepository historyRepository;
    private final KafkaProducerService kafkaProducerService;
    private final KafkaTemplate<String, ComplaintEvent> complaintEventKafkaTemplate;

    /**
     * Legal status transitions — enforces the lifecycle:
     * NEW → ASSIGNED → IN_PROGRESS → PENDING/RESOLVED → CLOSED
     */
    private static final Map<ComplaintStatus, EnumSet<ComplaintStatus>> ALLOWED_TRANSITIONS =
            new EnumMap<>(ComplaintStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(ComplaintStatus.NEW,
                EnumSet.of(ComplaintStatus.ASSIGNED));
        ALLOWED_TRANSITIONS.put(ComplaintStatus.ASSIGNED,
                EnumSet.of(ComplaintStatus.IN_PROGRESS));
        ALLOWED_TRANSITIONS.put(ComplaintStatus.IN_PROGRESS,
                EnumSet.of(ComplaintStatus.PENDING, ComplaintStatus.RESOLVED));
        ALLOWED_TRANSITIONS.put(ComplaintStatus.PENDING,
                EnumSet.of(ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED));
        ALLOWED_TRANSITIONS.put(ComplaintStatus.RESOLVED,
                EnumSet.of(ComplaintStatus.CLOSED));
        ALLOWED_TRANSITIONS.put(ComplaintStatus.CLOSED,
                EnumSet.noneOf(ComplaintStatus.class));  // terminal — no further transitions
    }

    public ComplaintService(ComplaintRepository complaintRepository,
                            OfficerRepository officerRepository,
                            ComplaintHistoryRepository historyRepository,
                            KafkaProducerService kafkaProducerService,
                            KafkaTemplate<String, ComplaintEvent> complaintEventKafkaTemplate) {
        this.complaintRepository = complaintRepository;
        this.officerRepository = officerRepository;
        this.historyRepository = historyRepository;
        this.kafkaProducerService = kafkaProducerService;
        this.complaintEventKafkaTemplate = complaintEventKafkaTemplate;
    }

    // ----------------------------------------------------------------
    // DEPARTMENT MAPPING UTILITIES
    // ----------------------------------------------------------------


    // ----------------------------------------------------------------
    // CREATE
    // ----------------------------------------------------------------
    public Complaint createComplaint(Complaint complaint) {
        // Enforce Single Active Application Rule
        java.util.List<ComplaintStatus> activeStatuses = java.util.Arrays.asList(
                ComplaintStatus.NEW, ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.PENDING
        );
        java.util.Optional<Complaint> existing = complaintRepository.findFirstByCitizenIdAndDepartmentAndTitleAndLocationAndStatusIn(
                complaint.getCitizenId(), complaint.getDepartment(), complaint.getTitle(), complaint.getLocation(), activeStatuses
        );
        if (existing.isPresent()) {
            throw new DuplicateApplicationException("You already have an active complaint for this issue.", existing.get());
        }

        LocalDateTime now = LocalDateTime.now();
        complaint.setCreatedAt(now);

        if (complaint.getStatus() == null)   complaint.setStatus(ComplaintStatus.NEW);
        if (complaint.getPriority() == null) complaint.setPriority(Complaint.Priority.MEDIUM);

        // Auto-assign officer based on department using database mapping
        if (complaint.getDepartment() != null) {
            List<Officer> officers = officerRepository.findByDepartmentIgnoreCase(complaint.getDepartment());
            if (!officers.isEmpty()) {
                String assignedOfficer = officers.get(0).getName();
                complaint.setAssignedOfficer(assignedOfficer);
                complaint.setStatus(ComplaintStatus.ASSIGNED); // Automatically transition to ASSIGNED
            }
        }

        // Calculate SLA deadline from priority
        LocalDateTime sla;
        if (complaint.getPriority() == Complaint.Priority.HIGH) {
            sla = now.plusHours(24);
        } else if (complaint.getPriority() == Complaint.Priority.LOW) {
            sla = now.plusDays(7);
        } else {
            sla = now.plusDays(3);
        }
        complaint.setSlaDeadline(sla);

        Complaint saved = complaintRepository.save(complaint);

        // Log the initial creation in history
        logHistory(saved.getComplaintId(), null, saved.getStatus().name(), "Complaint filed by citizen");

        // Kafka: typed complaint-created event
        ComplaintEvent createdEvent = new ComplaintEvent(
                "complaint-submitted",
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getDepartment(),
                null,
                saved.getStatus().name(),
                saved.getAssignedOfficer(),
                "Complaint successfully submitted",
                now
        );
        complaintEventKafkaTemplate.send("complaint-submitted", saved.getComplaintId().toString(), createdEvent);
        log.info("Published complaint-submitted event for complaintId={}", saved.getComplaintId());

        // Kafka notification to citizen (legacy notification channel)
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                null,
                "CREATED",
                "Your complaint '" + saved.getTitle() + "' has been successfully filed.",
                saved.getCitizenId(),
                now
        ));

        return saved;
    }

    public Page<Complaint> getAll(Pageable pageable) {
        return complaintRepository.findAll(pageable);
    }

    public Page<Complaint> getByOfficer(String username, Pageable pageable) {
        java.util.Optional<Officer> officerOpt = officerRepository.findByNameIgnoreCase(username);
        if (officerOpt.isPresent()) {
            return complaintRepository.findByDepartmentIgnoreCase(officerOpt.get().getDepartment(), pageable);
        }
        // Fallback for unknown users (e.g. admin or missing mapping)
        return complaintRepository.findByAssignedOfficer(username, pageable);
    }

    public Complaint assignOfficer(UUID complaintId, String officerUsername) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        String previousStatus = complaint.getStatus().name();
        validateTransition(complaint.getStatus(), ComplaintStatus.ASSIGNED);

        complaint.setAssignedOfficer(officerUsername);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        logHistory(complaintId, previousStatus, "ASSIGNED", "Manually assigned to officer: " + officerUsername);

        LocalDateTime now = LocalDateTime.now();

        // Publish Kafka event complaint-assigned
        ComplaintEvent assignedEvent = new ComplaintEvent(
                "complaint-assigned",
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getDepartment(),
                previousStatus,
                saved.getStatus().name(),
                saved.getAssignedOfficer(),
                "Assigned to " + officerUsername,
                now
        );
        complaintEventKafkaTemplate.send("complaint-assigned", saved.getComplaintId().toString(), assignedEvent);
        log.info("Published complaint-assigned event for complaintId={}", saved.getComplaintId());

        // Send Kafka notification to citizen
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getAssignedOfficer(),
                "STATUS_UPDATED",
                "Your complaint '" + saved.getTitle() + "' has been assigned to officer: " + officerUsername,
                saved.getCitizenId(),
                now
        ));

        // Send Kafka notification to officer
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getAssignedOfficer(),
                "ASSIGNED",
                "You have been assigned a new complaint: '" + saved.getTitle() + "'",
                officerUsername,
                now
        ));

        return saved;
    }

    // ----------------------------------------------------------------
    // ASSIGN — auto-picks first available officer in the department
    // ----------------------------------------------------------------
    public Complaint assignComplaint(UUID complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        validateTransition(complaint.getStatus(), ComplaintStatus.ASSIGNED);

        List<Officer> officers = officerRepository.findByDepartmentIgnoreCase(complaint.getDepartment());
        if (officers.isEmpty()) {
            throw new IllegalStateException(
                "No officers registered for department: '" + complaint.getDepartment() +
                "'. Add officers first via POST /api/officers");
        }

        String previousStatus = complaint.getStatus().name();
        Officer officer = officers.get(0);

        complaint.setAssignedOfficer(officer.getName());
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        logHistory(complaintId, previousStatus, "ASSIGNED", "Auto-assigned to officer: " + officer.getName());

        LocalDateTime now = LocalDateTime.now();
        // Kafka notification to citizen
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getAssignedOfficer(),
                "STATUS_UPDATED",
                "Your complaint '" + saved.getTitle() + "' has been assigned to officer: " + officer.getName(),
                saved.getCitizenId(),
                now
        ));

        // Kafka notification to assigned officer
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getAssignedOfficer(),
                "ASSIGNED",
                "You have been assigned a new complaint: '" + saved.getTitle() + "'",
                officer.getName(),
                now
        ));

        return saved;
    }

    // ----------------------------------------------------------------
    // STATUS UPDATE — enforces valid transitions, logs to history
    // ----------------------------------------------------------------
    public Complaint updateStatus(UUID complaintId, ComplaintStatus newStatus, String remarks) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        String previousStatus = complaint.getStatus().name();
        validateTransition(complaint.getStatus(), newStatus);

        complaint.setStatus(newStatus);
        complaint.setUpdatedAt(LocalDateTime.now());

        Complaint saved = complaintRepository.save(complaint);
        String finalRemarks = (remarks != null && !remarks.isBlank()) ? remarks : "Status updated to " + newStatus;
        logHistory(complaintId, previousStatus, newStatus.name(), finalRemarks);

        LocalDateTime now = LocalDateTime.now();

        // Kafka: typed complaint-status-changed event
        String eventTopic = "complaint-status-changed";
        if (newStatus == ComplaintStatus.IN_PROGRESS) {
            eventTopic = "complaint-in-progress";
        } else if (newStatus == ComplaintStatus.RESOLVED) {
            eventTopic = "complaint-resolved";
        }

        ComplaintEvent statusEvent = new ComplaintEvent(
                eventTopic,
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getDepartment(),
                previousStatus,
                newStatus.name(),
                saved.getAssignedOfficer(),
                finalRemarks,
                now
        );
        complaintEventKafkaTemplate.send(eventTopic, saved.getComplaintId().toString(), statusEvent);
        log.info("Published {}: {}   {}", eventTopic, previousStatus, newStatus);

        // Kafka notification to citizen (legacy notification channel)
        kafkaProducerService.sendNotification(new NotificationEvent(
                saved.getComplaintId(),
                saved.getCitizenId(),
                saved.getAssignedOfficer(),
                "STATUS_UPDATED",
                "Your complaint '" + saved.getTitle() + "' status has been updated to " + newStatus + ". Remarks: " + finalRemarks,
                saved.getCitizenId(),
                now
        ));

        // Kafka notification to officer (legacy)
        if (saved.getAssignedOfficer() != null) {
            kafkaProducerService.sendNotification(new NotificationEvent(
                    saved.getComplaintId(),
                    saved.getCitizenId(),
                    saved.getAssignedOfficer(),
                    "STATUS_UPDATED",
                    "Status of assigned complaint '" + saved.getTitle() + "' updated to " + newStatus,
                    saved.getAssignedOfficer(),
                    now
            ));
        }

        return saved;
    }

    // ----------------------------------------------------------------
    // HISTORY — returns the full audit trail for a complaint
    // ----------------------------------------------------------------
    public List<ComplaintHistory> getHistory(UUID complaintId) {
        return historyRepository.findByComplaintIdOrderByTimestampAsc(complaintId);
    }

    // ----------------------------------------------------------------
    // SLA — returns all complaints that are currently OVERDUE
    // ----------------------------------------------------------------
    public List<Complaint> getOverdueComplaints() {
        return complaintRepository.findAll().stream()
                .filter(c -> c.getSlaStatus() == Complaint.SlaStatus.OVERDUE)
                .toList();
    }

    // ----------------------------------------------------------------
    // DASHBOARD STATS
    // ----------------------------------------------------------------
    public DashboardStats getDashboardStats() {
        List<Complaint> all = complaintRepository.findAll();

        long total = all.size();
        long resolved = all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED || c.getStatus() == ComplaintStatus.CLOSED).count();
        long overdue = all.stream().filter(c -> c.getSlaStatus() == Complaint.SlaStatus.OVERDUE).count();
        long pending = total - resolved;

        double resolutionRate = total == 0 ? 0.0 : Math.round((resolved * 10000.0 / total)) / 100.0;

        Map<String, Long> byDepartment = all.stream()
                .collect(Collectors.groupingBy(Complaint::getDepartment, Collectors.counting()));

        Map<String, Long> byPriority = all.stream()
                .collect(Collectors.groupingBy(c -> c.getPriority() != null ? c.getPriority().name() : "UNKNOWN", Collectors.counting()));

        Map<String, Long> byStatus = all.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus() != null ? c.getStatus().name() : "UNKNOWN", Collectors.counting()));

        return new DashboardStats(
                total,
                resolved,
                pending,
                overdue,
                resolutionRate,
                byDepartment,
                byPriority,
                byStatus
        );
    }

    // ----------------------------------------------------------------
    // ESCALATION helper — public so EscalationService can also log history
    // ----------------------------------------------------------------
    public void logHistoryPublic(UUID complaintId, String previousStatus, String newStatus, String remarks) {
        logHistory(complaintId, previousStatus, newStatus, remarks);
    }

    // ----------------------------------------------------------------
    // PRIVATE helpers
    // ----------------------------------------------------------------
    private void logHistory(UUID complaintId, String previousStatus, String newStatus, String remarks) {
        ComplaintHistory entry = new ComplaintHistory();
        entry.setComplaintId(complaintId);
        entry.setPreviousStatus(previousStatus);
        entry.setNewStatus(newStatus);
        entry.setRemarks(remarks);
        entry.setTimestamp(LocalDateTime.now());
        historyRepository.save(entry);
    }

    private void validateTransition(ComplaintStatus current, ComplaintStatus next) {
        EnumSet<ComplaintStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(
                current, EnumSet.noneOf(ComplaintStatus.class));

        if (!allowed.contains(next)) {
            throw new IllegalStateException(
                "Invalid status transition: cannot move from [" + current + "] to [" + next + "]. " +
                "Allowed transitions from " + current + ": " + allowed);
        }
    }
}
