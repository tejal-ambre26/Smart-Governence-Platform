package com.civicpulse.reporting_service.service;

import com.civicpulse.reporting_service.dto.AiGovernanceResponse;
import com.civicpulse.reporting_service.dto.GovernanceSummary;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Calls the Google Gemini REST API (gemini-flash-latest) using Spring's RestClient.
 *
 * SECURITY:
 *  - API key is read from the GEMINI_API_KEY environment variable only.
 *  - The key is never logged, never returned in any response, never sent to the frontend.
 *  - Only aggregated governance statistics (PII-free) are sent to Gemini.
 *  - No names, Aadhaar, JWTs, passwords, or bank data are ever included.
 *
 * M4 Enhancement:
 *  - Richer prompt requesting section-level intelligence:
 *    departmentPriorities, welfareInsights, financialInsights, serviceInsights, slaInsights.
 */
@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent}")
    private String geminiUrl;

    private final RestClient restClient;
    private final ReportAggregationService aggregationService;
    private final GovernanceDataBuilder dataBuilder;
    private final ObjectMapper objectMapper;

    public GeminiService(ReportAggregationService aggregationService,
                         GovernanceDataBuilder dataBuilder) {
        this.restClient        = RestClient.create();
        this.aggregationService = aggregationService;
        this.dataBuilder       = dataBuilder;
        this.objectMapper      = new ObjectMapper();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a full governance analysis using live CivicPulse data.
     * If Gemini is unavailable, returns a graceful fallback with aiUnavailable=true.
     */
    public AiGovernanceResponse analyzeGovernance() {
        return analyzeGovernance(null);
    }

    public AiGovernanceResponse analyzeGovernance(String overrideApiKey) {
        String effectiveKey = getEffectiveKey(overrideApiKey);
        if (effectiveKey == null || effectiveKey.isBlank()) {
            return AiGovernanceResponse.unavailable("Gemini API key not configured on the server or request.");
        }
        try {
            GovernanceSummary summary = aggregationService.buildGovernanceSummary();
            String statsJson = dataBuilder.buildSafeStatsJson(summary);
            String prompt = buildAnalysisPrompt(statsJson);
            return callGemini(prompt, effectiveKey);
        } catch (Exception e) {
            log.warn("Gemini analysis failed: {}", e.getMessage());
            return AiGovernanceResponse.unavailable("AI analysis temporarily unavailable: " + e.getMessage());
        }
    }

    public AiGovernanceResponse chat(String question) {
        return chat(question, null);
    }

    public AiGovernanceResponse chat(String question, String overrideApiKey) {
        if (question == null || question.isBlank()) {
            return AiGovernanceResponse.unavailable("Please provide a question.");
        }
        String effectiveKey = getEffectiveKey(overrideApiKey);
        if (effectiveKey == null || effectiveKey.isBlank()) {
            return AiGovernanceResponse.unavailable("Gemini API key not configured on the server or request.");
        }
        try {
            GovernanceSummary summary = aggregationService.buildGovernanceSummary();
            String statsJson = dataBuilder.buildSafeStatsJson(summary);
            String prompt = buildChatPrompt(statsJson, question);
            return callGemini(prompt, effectiveKey);
        } catch (Exception e) {
            log.warn("Gemini chat failed: {}", e.getMessage());
            return AiGovernanceResponse.unavailable("AI chat temporarily unavailable: " + e.getMessage());
        }
    }

    private String getEffectiveKey(String overrideKey) {
        if (overrideKey != null && !overrideKey.isBlank()) {
            return overrideKey.trim();
        }
        return apiKey != null ? apiKey.trim() : "";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROMPT BUILDERS
    // ─────────────────────────────────────────────────────────────────────────

    private String buildAnalysisPrompt(String statsJson) {
        return """
            You are CivicPulse AI Governance Intelligence, an expert municipal governance analyst.
            Analyze the following REAL governance statistics from CivicPulse Nexus and produce a structured JSON report.

            STRICT RULES:
            - Use ONLY the data provided. Do NOT invent statistics, department names, citizens, or financial values.
            - If a value is 0 or unavailable, report it honestly — never fabricate a positive number.
            - If satisfactionDataAvailable is false, say satisfaction data is unavailable.
            - If dataAvailable for any section is false, note that service is unreachable.
            - Be direct, factual, and actionable.
            - Keep each insight/warning/recommendation to one concise sentence (max 25 words).

            GOVERNANCE DATA:
            %s

            Respond ONLY with a valid JSON object in this exact structure (no markdown, no code fences):
            {
              "overallStatus": "HIGH_PERFORMANCE | GOOD | NEEDS_ATTENTION | CRITICAL",
              "summary": "One paragraph executive summary based strictly on the above data.",
              "insights": ["insight 1 (max 25 words)", "insight 2", "insight 3"],
              "warnings": ["warning 1 if critical issue exists"],
              "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
              "departmentPriorities": ["Dept needing most attention based on volume/resolution rate", "second priority dept"],
              "welfareInsights": ["Insight about welfare beneficiary count or budget utilization", "second welfare insight"],
              "financialInsights": ["Insight about revenue collected vs budget disbursed", "second financial insight"],
              "serviceInsights": ["Insight about certificate/permit approval rates or pending backlog", "second service insight"],
              "slaInsights": ["Insight about overdue complaints or turnaround times", "second SLA insight"],
              "dataTimestamp": "%s"
            }
            """.formatted(statsJson, LocalDateTime.now().toString());
    }

    private String buildChatPrompt(String statsJson, String question) {
        return """
            You are CivicPulse AI Governance Intelligence, an expert municipal governance analyst.
            Answer the admin's question using ONLY the CivicPulse governance data provided below.

            STRICT RULES:
            - Use ONLY the data provided. Do NOT invent statistics, departments, citizens, or financial values.
            - If the data does not support an answer, say exactly: "Insufficient data to answer this question."
            - Be concise, direct, and actionable.
            - Never mention external municipal statistics or benchmark data not present in the provided stats.

            GOVERNANCE DATA:
            %s

            ADMIN QUESTION: %s

            Respond ONLY with a valid JSON object (no markdown, no code fences):
            {
              "overallStatus": "INFO",
              "summary": "Direct answer to the question based only on the data above.",
              "insights": ["relevant observation 1", "relevant observation 2"],
              "warnings": [],
              "recommendations": ["actionable recommendation if applicable"],
              "departmentPriorities": [],
              "welfareInsights": [],
              "financialInsights": [],
              "serviceInsights": [],
              "slaInsights": [],
              "dataTimestamp": "%s"
            }
            """.formatted(statsJson, question, LocalDateTime.now().toString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI REST CALL
    // ─────────────────────────────────────────────────────────────────────────

    private AiGovernanceResponse callGemini(String prompt, String effectiveKey) {
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.2,
                "maxOutputTokens", 4096
            )
        );

        String urlWithKey = geminiUrl + "?key=" + effectiveKey;

        String rawResponse = restClient.post()
            .uri(urlWithKey)
            .header("Content-Type", "application/json")
            .body(requestBody)
            .retrieve()
            .body(String.class);

        return parseGeminiResponse(rawResponse);
    }

    private AiGovernanceResponse parseGeminiResponse(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                return AiGovernanceResponse.unavailable("Gemini returned no candidates.");
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            StringBuilder sb = new StringBuilder();
            if (parts.isArray()) {
                for (JsonNode part : parts) {
                    if (part.has("text")) sb.append(part.path("text").asText());
                }
            }

            String jsonText = extractJsonString(sb.toString());
            JsonNode aiJson = objectMapper.readTree(jsonText);

            AiGovernanceResponse response = new AiGovernanceResponse();
            response.setOverallStatus(aiJson.path("overallStatus").asText("UNKNOWN"));
            response.setSummary(aiJson.path("summary").asText(""));
            response.setDataTimestamp(aiJson.path("dataTimestamp").asText(LocalDateTime.now().toString()));
            response.setAiUnavailable(false);

            response.setInsights(toStringList(aiJson.path("insights")));
            response.setWarnings(toStringList(aiJson.path("warnings")));
            response.setRecommendations(toStringList(aiJson.path("recommendations")));
            response.setDepartmentPriorities(toStringList(aiJson.path("departmentPriorities")));
            response.setWelfareInsights(toStringList(aiJson.path("welfareInsights")));
            response.setFinancialInsights(toStringList(aiJson.path("financialInsights")));
            response.setServiceInsights(toStringList(aiJson.path("serviceInsights")));
            response.setSlaInsights(toStringList(aiJson.path("slaInsights")));

            return response;
        } catch (Exception e) {
            log.warn("Failed to parse Gemini response: {}", e.getMessage(), e);
            return AiGovernanceResponse.unavailable("Could not parse AI response. Please try again.");
        }
    }

    private String extractJsonString(String rawText) {
        if (rawText == null || rawText.isBlank()) return "{}";
        String s = rawText.strip();
        int firstBrace = s.indexOf('{');
        int lastBrace  = s.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace > firstBrace) {
            return s.substring(firstBrace, lastBrace + 1);
        }
        return s;
    }

    private List<String> toStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    private boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
