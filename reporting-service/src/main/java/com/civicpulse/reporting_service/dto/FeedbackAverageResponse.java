package com.civicpulse.reporting_service.dto;

import java.util.Map;

public class FeedbackAverageResponse {

    private double overallAverage;
    private long totalResponses;
    private Map<String, Double> averageByReferenceType;
    private Map<String, Long> countByReferenceType;

    public FeedbackAverageResponse() {}

    public FeedbackAverageResponse(double overallAverage, long totalResponses,
                                    Map<String, Double> averageByReferenceType,
                                    Map<String, Long> countByReferenceType) {
        this.overallAverage = overallAverage;
        this.totalResponses = totalResponses;
        this.averageByReferenceType = averageByReferenceType;
        this.countByReferenceType = countByReferenceType;
    }

    public double getOverallAverage() { return overallAverage; }
    public long getTotalResponses() { return totalResponses; }
    public Map<String, Double> getAverageByReferenceType() { return averageByReferenceType; }
    public Map<String, Long> getCountByReferenceType() { return countByReferenceType; }

    public void setOverallAverage(double overallAverage) { this.overallAverage = overallAverage; }
    public void setTotalResponses(long totalResponses) { this.totalResponses = totalResponses; }
    public void setAverageByReferenceType(Map<String, Double> averageByReferenceType) { this.averageByReferenceType = averageByReferenceType; }
    public void setCountByReferenceType(Map<String, Long> countByReferenceType) { this.countByReferenceType = countByReferenceType; }
}
