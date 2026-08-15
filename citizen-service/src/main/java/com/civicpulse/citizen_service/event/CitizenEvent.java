package com.civicpulse.citizen_service.event;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kafka event published to the "citizen-registered" topic
 * whenever a new citizen completes self-registration.
 *
 * Note: Written as a plain POJO (no Lombok) for Java 25 compatibility.
 */
public class CitizenEvent {
    /** Event type: "REGISTERED" */
    private String eventType;
    private UUID citizenId;
    private String name;
    private String email;
    private LocalDateTime timestamp;

    /** Required by Jackson for deserialization */
    public CitizenEvent() {}

    public CitizenEvent(String eventType, UUID citizenId, String name, String email, LocalDateTime timestamp) {
        this.eventType = eventType;
        this.citizenId = citizenId;
        this.name = name;
        this.email = email;
        this.timestamp = timestamp;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getCitizenId() { return citizenId; }
    public void setCitizenId(UUID citizenId) { this.citizenId = citizenId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
