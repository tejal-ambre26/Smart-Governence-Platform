package com.civicpulse.reporting_service.controller;

import com.civicpulse.reporting_service.dto.AiGovernanceRequest;
import com.civicpulse.reporting_service.dto.AiGovernanceResponse;
import com.civicpulse.reporting_service.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * AI Governance Intelligence endpoints.
 *
 * POST /api/ai/governance/analyze  — full governance analysis using live CivicPulse data
 * POST /api/ai/governance/chat     — answer a specific admin governance question
 *
 * Both endpoints are ADMIN-only. The Gemini API key is never sent to the frontend.
 */
@RestController
@RequestMapping("/api/ai/governance")
public class AiGovernanceController {

    private final GeminiService geminiService;

    public AiGovernanceController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * Generates a full AI-powered governance analysis:
     * executive summary, key insights, warnings, and recommendations
     * based on real-time CivicPulse data.
     */
    @PostMapping("/analyze")
    public ResponseEntity<AiGovernanceResponse> analyze(
            @RequestHeader(value = "X-Gemini-Api-Key", required = false) String apiKeyHeader) {
        AiGovernanceResponse response = geminiService.analyzeGovernance(apiKeyHeader);
        return ResponseEntity.ok(response);
    }

    /**
     * Answers a specific governance question from the admin.
     * The AI answers strictly from live CivicPulse statistics.
     * Returns "Insufficient data" when the data cannot support an answer.
     */
    @PostMapping("/chat")
    public ResponseEntity<AiGovernanceResponse> chat(
            @RequestBody AiGovernanceRequest request,
            @RequestHeader(value = "X-Gemini-Api-Key", required = false) String apiKeyHeader) {
        AiGovernanceResponse response = geminiService.chat(request.getQuestion(), apiKeyHeader);
        return ResponseEntity.ok(response);
    }
}
