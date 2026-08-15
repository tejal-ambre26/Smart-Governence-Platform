package com.civicpulse.reporting_service.service;

import com.civicpulse.reporting_service.dto.FeedbackAverageResponse;
import com.civicpulse.reporting_service.entity.Feedback;
import com.civicpulse.reporting_service.repository.FeedbackRepository;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackService {

    private final FeedbackRepository repo;

    public FeedbackService(FeedbackRepository repo) {
        this.repo = repo;
    }

    public Feedback submitFeedback(@Valid Feedback feedback) {
        return repo.save(feedback);
    }

    public double getOverallAverageRating() {
        List<Feedback> all = repo.findAll();
        if (all.isEmpty()) return 0.0;
        return all.stream()
                .mapToInt(Feedback::getRating)
                .average()
                .orElse(0.0);
    }

    public FeedbackAverageResponse getAverageBreakdown() {
        List<Feedback> all = repo.findAll();
        long total = all.size();

        double overall = total == 0 ? 0.0
                : all.stream().mapToInt(Feedback::getRating).average().orElse(0.0);

        Map<String, Double> avgByType = new LinkedHashMap<>();
        Map<String, Long> countByType = new LinkedHashMap<>();

        for (Feedback.ReferenceType type : Feedback.ReferenceType.values()) {
            List<Feedback> subset = repo.findByReferenceType(type);
            avgByType.put(type.name(),
                subset.isEmpty() ? 0.0 : subset.stream().mapToInt(Feedback::getRating).average().orElse(0.0));
            countByType.put(type.name(), (long) subset.size());
        }

        return new FeedbackAverageResponse(
                Math.round(overall * 100.0) / 100.0,
                total,
                avgByType,
                countByType
        );
    }
}
