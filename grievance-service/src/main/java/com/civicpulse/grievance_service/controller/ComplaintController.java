package com.civicpulse.grievance_service.controller;

import com.civicpulse.grievance_service.entity.Complaint;
import com.civicpulse.grievance_service.entity.Complaint.ComplaintStatus;
import com.civicpulse.grievance_service.entity.ComplaintHistory;
import com.civicpulse.grievance_service.dto.DashboardStats;
import com.civicpulse.grievance_service.repository.ComplaintRepository;
import com.civicpulse.grievance_service.service.ComplaintService;
import com.civicpulse.grievance_service.service.EscalationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final ComplaintService complaintService;
    private final EscalationService escalationService;

    public ComplaintController(ComplaintRepository complaintRepository,
                               ComplaintService complaintService,
                               EscalationService escalationService) {
        this.complaintRepository = complaintRepository;
        this.complaintService = complaintService;
        this.escalationService = escalationService;
    }

    // CREATE — defaults status=NEW, calculates SLA, logs first history entry
    @PostMapping
    public ResponseEntity<Complaint> createComplaint(@Valid @RequestBody Complaint complaint) {
        return ResponseEntity.ok(complaintService.createComplaint(complaint));
    }

    // READ — all complaints (supports sorting and pagination)
    // Note: "priority,desc" (High→Low) is remapped to "priorityOrder,asc" internally
    //       because priorityOrder stores 1=HIGH, 2=MEDIUM, 3=LOW.
    @GetMapping
    public ResponseEntity<?> getAllComplaints(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParams = sort.split(",");
        String sortField = sortParams[0];
        Sort.Direction direction = Sort.Direction.fromString(sortParams[1]);

        // Priority sort: "priority,desc" means HIGH first — map to priorityOrder ASC
        if ("priority".equalsIgnoreCase(sortField)) {
            sortField = "priorityOrder";
            direction = Sort.Direction.ASC;
        }

        Sort sortObj = Sort.by(direction, sortField);

        if (page == null || size == null) {
            return ResponseEntity.ok(complaintRepository.findAll(sortObj));
        }

        Pageable pageable = PageRequest.of(page, size, sortObj);
        return ResponseEntity.ok(complaintService.getAll(pageable));
    }

    // READ — overdue complaints only (must be BEFORE /{id} to avoid UUID parse clash)
    @GetMapping("/overdue")
    public ResponseEntity<List<Complaint>> getOverdueComplaints() {
        return ResponseEntity.ok(complaintService.getOverdueComplaints());
    }

    // DASHBOARD STATS
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(complaintService.getDashboardStats());
    }

    // SEARCH COMPLAINTS
    @GetMapping("/search")
    public ResponseEntity<List<Complaint>> searchComplaints(
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) Complaint.Priority priority,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String ward) {
        return ResponseEntity.ok(complaintRepository.searchComplaints(status, priority, department, ward));
    }

    // READ — complaints by citizen
    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<Complaint>> getComplaintsByCitizenId(@PathVariable String citizenId) {
        return ResponseEntity.ok(complaintRepository.findByCitizenId(citizenId));
    }

    // READ — complaints by assigned officer
    @GetMapping("/officer/{username}")
    public ResponseEntity<List<Complaint>> getComplaintsByAssignedOfficer(@PathVariable String username) {
        return ResponseEntity.ok(complaintRepository.findByAssignedOfficer(username));
    }

    // READ — complaints by authenticated officer (paginated)
    @GetMapping("/officer")
    public ResponseEntity<Page<Complaint>> getOfficerComplaints(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String officerUsername = jwt.getClaimAsString("preferred_username");
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(complaintService.getByOfficer(officerUsername, pageable));
    }

    // READ — single complaint by UUID (includes slaStatus in JSON automatically via @Transient)
    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable UUID id) {
        return complaintRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ — full audit trail / timeline
    @GetMapping("/{id}/history")
    public ResponseEntity<List<ComplaintHistory>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getHistory(id));
    }

    // UPDATE — assign officer (auto-assigns if body/params are empty, manually assigns if officerUsername is specified)
    @PutMapping("/{id}/assign")
    public ResponseEntity<Complaint> assignComplaint(
            @PathVariable UUID id,
            @RequestParam(required = false) String officerUsername,
            @RequestBody(required = false) Map<String, String> payload) {

        String targetOfficer = officerUsername;
        if (targetOfficer == null && payload != null) {
            targetOfficer = payload.get("officerUsername");
        }

        if (targetOfficer != null && !targetOfficer.trim().isEmpty()) {
            return ResponseEntity.ok(complaintService.assignOfficer(id, targetOfficer));
        }

        return ResponseEntity.ok(complaintService.assignComplaint(id));
    }

    // UPDATE — status transition with optional remarks (enforces valid transitions)
    @PutMapping("/{id}/status")
    public ResponseEntity<Complaint> updateStatus(
            @PathVariable UUID id,
            @RequestParam ComplaintStatus status,
            @RequestParam(required = false, defaultValue = "") String remarks) {
        return ResponseEntity.ok(complaintService.updateStatus(id, status, remarks));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(@PathVariable UUID id) {
        if (!complaintRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        complaintRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // TEST UTILITY — manually trigger escalation check without waiting 1 hour
    @PostMapping("/escalation/run-now")
    public ResponseEntity<String> runEscalationNow() {
        escalationService.runNow();
        return ResponseEntity.ok("Escalation check completed. Check overdue complaints and their history.");
    }
}