package com.civicpulse.reporting_service.repository;

import com.civicpulse.reporting_service.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    List<Feedback> findByReferenceType(Feedback.ReferenceType referenceType);
    boolean existsByCitizenIdAndReferenceId(String citizenId, UUID referenceId);
}
