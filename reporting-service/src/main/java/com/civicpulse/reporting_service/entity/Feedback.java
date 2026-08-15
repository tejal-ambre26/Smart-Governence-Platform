package com.civicpulse.reporting_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID feedbackId;

    @Column(nullable = false)
    private String citizenId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferenceType referenceType;

    @Column(nullable = false)
    private UUID referenceId;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comments;

    private LocalDateTime submittedAt;

    @PrePersist
    public void prePersist() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
    }

    public enum ReferenceType {
        COMPLAINT, CERTIFICATE_APPLICATION, WELFARE_APPLICATION
    }

    public Feedback() {}

    // Getters
    public UUID getFeedbackId() { return feedbackId; }
    public String getCitizenId() { return citizenId; }
    public ReferenceType getReferenceType() { return referenceType; }
    public UUID getReferenceId() { return referenceId; }
    public Integer getRating() { return rating; }
    public String getComments() { return comments; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }

    // Setters
    public void setFeedbackId(UUID feedbackId) { this.feedbackId = feedbackId; }
    public void setCitizenId(String citizenId) { this.citizenId = citizenId; }
    public void setReferenceType(ReferenceType referenceType) { this.referenceType = referenceType; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }
    public void setRating(Integer rating) { this.rating = rating; }
    public void setComments(String comments) { this.comments = comments; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
