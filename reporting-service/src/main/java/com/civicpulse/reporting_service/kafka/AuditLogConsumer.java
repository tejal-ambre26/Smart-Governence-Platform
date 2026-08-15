package com.civicpulse.reporting_service.kafka;

import com.civicpulse.reporting_service.entity.AuditLog;
import com.civicpulse.reporting_service.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer that subscribes to ALL event topics across all milestones.
 * Writes each event verbatim into the audit_logs table — append-only, never updated or deleted.
 * This is the first real consumer in the system, making good on the "Kafka ensures event ordering"
 * promise from the architecture documentation.
 */
@Component
public class AuditLogConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditLogConsumer.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuditLogConsumer(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // ─── Grievance service events ─────────────────────────────────────────────
    @KafkaListener(topics = "complaint-status-changed", groupId = "reporting-service-group")
    public void onComplaintStatusChanged(String payload) {
        persist("complaint-status-changed", payload);
    }

    @KafkaListener(topics = "complaint-escalated", groupId = "reporting-service-group")
    public void onComplaintEscalated(String payload) {
        persist("complaint-escalated", payload);
    }

    // ─── Service management events ────────────────────────────────────────────
    @KafkaListener(topics = "application-submitted", groupId = "reporting-service-group")
    public void onApplicationSubmitted(String payload) {
        persist("application-submitted", payload);
    }

    @KafkaListener(topics = "document-verified", groupId = "reporting-service-group")
    public void onDocumentVerified(String payload) {
        persist("document-verified", payload);
    }

    @KafkaListener(topics = "certificate-approved", groupId = "reporting-service-group")
    public void onCertificateApproved(String payload) {
        persist("certificate-approved", payload);
    }

    @KafkaListener(topics = "certificate-generated", groupId = "reporting-service-group")
    public void onCertificateGenerated(String payload) {
        persist("certificate-generated", payload);
    }

    // ─── Welfare service events ───────────────────────────────────────────────
    @KafkaListener(topics = "beneficiary-applied", groupId = "reporting-service-group")
    public void onBeneficiaryApplied(String payload) {
        persist("beneficiary-applied", payload);
    }

    @KafkaListener(topics = "beneficiary-approved", groupId = "reporting-service-group")
    public void onBeneficiaryApproved(String payload) {
        persist("beneficiary-approved", payload);
    }

    @KafkaListener(topics = "beneficiary-rejected", groupId = "reporting-service-group")
    public void onBeneficiaryRejected(String payload) {
        persist("beneficiary-rejected", payload);
    }

    @KafkaListener(topics = "funds-disbursed", groupId = "reporting-service-group")
    public void onFundsDisbursed(String payload) {
        persist("funds-disbursed", payload);
    }

    @KafkaListener(topics = "budget-threshold-alert", groupId = "reporting-service-group")
    public void onBudgetThresholdAlert(String payload) {
        persist("budget-threshold-alert", payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER — extract entityId from payload JSON and save audit log row
    // ─────────────────────────────────────────────────────────────────────────
    private void persist(String eventType, String payload) {
        try {
            String entityId = extractEntityId(payload);
            AuditLog entry = new AuditLog(eventType, entityId, payload);
            auditLogRepository.save(entry);
            log.debug("Audit log persisted: topic={}, entityId={}", eventType, entityId);
        } catch (Exception e) {
            log.error("Failed to persist audit log for topic {}: {}", eventType, e.getMessage(), e);
        }
    }

    /**
     * Tries to extract a meaningful entity ID from the JSON payload.
     * Looks for common ID fields across all event types.
     */
    private String extractEntityId(String payload) {
        if (payload == null || payload.isBlank()) return "unknown";
        try {
            JsonNode node = objectMapper.readTree(payload);
            // Try common ID fields in order of specificity
            for (String field : new String[]{
                    "complaintId", "applicationId", "beneficiaryId",
                    "entityId", "id", "applicationNumber", "complaintNumber"}) {
                JsonNode idNode = node.get(field);
                if (idNode != null && !idNode.isNull()) {
                    return idNode.asText();
                }
            }
        } catch (Exception e) {
            log.debug("Could not parse payload JSON for entityId extraction: {}", e.getMessage());
        }
        return "unknown";
    }
}
