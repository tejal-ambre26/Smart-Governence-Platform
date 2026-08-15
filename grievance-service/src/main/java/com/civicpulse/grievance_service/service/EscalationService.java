package com.civicpulse.grievance_service.service;

import com.civicpulse.grievance_service.entity.Complaint;
import com.civicpulse.grievance_service.entity.Complaint.ComplaintStatus;
import com.civicpulse.grievance_service.entity.Officer;
import com.civicpulse.grievance_service.event.ComplaintEvent;
import com.civicpulse.grievance_service.repository.ComplaintRepository;
import com.civicpulse.grievance_service.repository.OfficerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EscalationService {

    private static final Logger log = LoggerFactory.getLogger(EscalationService.class);

    private final ComplaintRepository complaintRepository;
    private final OfficerRepository officerRepository;
    private final ComplaintService complaintService;
    private final KafkaTemplate<String, ComplaintEvent> complaintEventKafkaTemplate;

    public EscalationService(ComplaintRepository complaintRepository,
                             OfficerRepository officerRepository,
                             ComplaintService complaintService,
                             KafkaTemplate<String, ComplaintEvent> complaintEventKafkaTemplate) {
        this.complaintRepository = complaintRepository;
        this.officerRepository = officerRepository;
        this.complaintService = complaintService;
        this.complaintEventKafkaTemplate = complaintEventKafkaTemplate;
    }

    /**
     * Scheduled escalation check — runs every hour.
     * Finds all active complaints where SLA deadline has passed,
     * and auto-escalates them to a senior officer in the same department.
     */
    @Scheduled(fixedRate = 3_600_000)   // every 1 hour = 3,600,000 ms
    public void checkAndEscalateOverdueComplaints() {
        LocalDateTime now = LocalDateTime.now();

        List<Complaint> allComplaints = complaintRepository.findAll();

        for (Complaint complaint : allComplaints) {
            boolean isOverdue = complaint.getSlaDeadline() != null
                    && now.isAfter(complaint.getSlaDeadline());

            boolean isActive = complaint.getStatus() != ComplaintStatus.RESOLVED
                    && complaint.getStatus() != ComplaintStatus.CLOSED;
            boolean notYetEscalated = !Boolean.TRUE.equals(complaint.isEscalated());

            if (isOverdue && isActive && notYetEscalated) {
                escalateComplaint(complaint);
            }
        }
    }

    /**
     * Escalates a single complaint to the senior officer in its department.
     * If no senior officer exists, logs the escalation with a note.
     */
    private void escalateComplaint(Complaint complaint) {
        // Look for a senior officer in this department
        List<Officer> seniorOfficers = officerRepository
                .findByDepartmentIgnoreCaseAndSeniorOfficerTrue(complaint.getDepartment());

        String assignedTo;
        if (!seniorOfficers.isEmpty()) {
            assignedTo = seniorOfficers.get(0).getName();
            complaint.setAssignedOfficer(assignedTo);
        } else {
            // No senior officer configured — note it but still mark escalated
            assignedTo = "Department Head (no senior officer configured for " + complaint.getDepartment() + ")";
        }

        complaint.setEscalated(true);
        int currentLevel = complaint.getEscalationLevel() != null ? complaint.getEscalationLevel() : 0;
        complaint.setEscalationLevel(currentLevel + 1);
        complaint.setUpdatedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        // Log escalation in the audit history (status doesn't change, only assignment does)
        complaintService.logHistoryPublic(
                complaint.getComplaintId(),
                complaint.getStatus() != null ? complaint.getStatus().name() : "NEW",
                complaint.getStatus() != null ? complaint.getStatus().name() : "NEW",
                "SLA breached — auto-escalated to: " + assignedTo +
                " (Escalation Level " + complaint.getEscalationLevel() + ")"
        );

        // Kafka: typed complaint-escalated event
        ComplaintEvent escalationEvent = new ComplaintEvent(
                "ESCALATED",
                complaint.getComplaintId(),
                complaint.getCitizenId(),
                complaint.getDepartment(),
                "ASSIGNED",
                "ESCALATED",
                complaint.getAssignedOfficer(),
                "Auto-escalated: SLA breached at " + LocalDateTime.now() + " — reassigned to: " + assignedTo,
                LocalDateTime.now()
        );
        complaintEventKafkaTemplate.send("complaint-escalated", complaint.getComplaintId().toString(), escalationEvent);
        log.info("Escalation event published for complaintId={}", complaint.getComplaintId());
    }

    /**
     * Manual trigger — call this from the test endpoint to immediately
     * run the escalation check without waiting for the hourly schedule.
     */
    public void runNow() {
        checkAndEscalateOverdueComplaints();
    }
}
