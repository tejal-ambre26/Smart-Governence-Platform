package com.civicpulse.reporting_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit log — append-only.
 * Never update or delete rows from this table.
 * Stores raw Kafka event payloads verbatim for compliance/audit trail.
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_event_type", columnList = "eventType"),
    @Index(name = "idx_audit_entity_id", columnList = "entityId"),
    @Index(name = "idx_audit_received_at", columnList = "receivedAt")
})
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID auditId;

    @Column(nullable = false)
    private String eventType;

    // The ID of the entity this event pertains to (complaint ID, application ID, etc.)
    private String entityId;

    // Raw JSON event payload — stored verbatim, never modified
    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Column(nullable = false)
    private LocalDateTime receivedAt;

    @PrePersist
    public void prePersist() {
        if (this.receivedAt == null) {
            this.receivedAt = LocalDateTime.now();
        }
    }

    public AuditLog() {}

    public AuditLog(String eventType, String entityId, String payload) {
        this.eventType = eventType;
        this.entityId = entityId;
        this.payload = payload;
        this.receivedAt = LocalDateTime.now();
    }

    // Getters
    public UUID getAuditId() { return auditId; }
    public String getEventType() { return eventType; }
    public String getEntityId() { return entityId; }
    public String getPayload() { return payload; }
    public LocalDateTime getReceivedAt() { return receivedAt; }

    // Setters (no setter for auditId — immutable primary key)
    public void setEventType(String eventType) { this.eventType = eventType; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public void setPayload(String payload) { this.payload = payload; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
}
