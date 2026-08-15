package com.civicpulse.reporting_service.dto;

/**
 * Request body for POST /api/ai/governance/chat
 */
public class AiGovernanceRequest {

    private String question;

    public AiGovernanceRequest() {}

    public AiGovernanceRequest(String question) {
        this.question = question;
    }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
}
