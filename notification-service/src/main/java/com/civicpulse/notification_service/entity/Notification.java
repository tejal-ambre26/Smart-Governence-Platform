package com.civicpulse.notification_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID notificationId;

    private String recipient; // citizenId or officer username
    private String eventType;
    private String title;
    private String message;
    private String relatedEntityId;
    private String relatedEntityType; // COMPLAINT or CERTIFICATE
    private boolean readStatus;
    private String recipientRole;
    private LocalDateTime createdAt;

    // JPA requires a no-arg constructor
    public Notification() {}

    public Notification(String recipient, String eventType, String title, String message, 
                        String relatedEntityId, String relatedEntityType, boolean readStatus, 
                        String recipientRole, LocalDateTime createdAt) {
        this.recipient = recipient;
        this.eventType = eventType;
        this.title = title;
        this.message = message;
        this.relatedEntityId = relatedEntityId;
        this.relatedEntityType = relatedEntityType;
        this.readStatus = readStatus;
        this.recipientRole = recipientRole;
        this.createdAt = createdAt;
    }

    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(String relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }

    public boolean isReadStatus() { return readStatus; }
    public void setReadStatus(boolean readStatus) { this.readStatus = readStatus; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
