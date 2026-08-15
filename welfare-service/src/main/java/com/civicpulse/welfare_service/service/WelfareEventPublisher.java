package com.civicpulse.welfare_service.service;

import com.civicpulse.welfare_service.event.WelfareEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class WelfareEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(WelfareEventPublisher.class);

    private static final String TOPIC_APPLIED   = "beneficiary-applied";
    private static final String TOPIC_APPROVED  = "beneficiary-approved";
    private static final String TOPIC_REJECTED  = "beneficiary-rejected";
    private static final String TOPIC_DISBURSED = "funds-disbursed";
    private static final String TOPIC_ALERT     = "budget-threshold-alert";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public WelfareEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishApplied(WelfareEvent event) {
        publish(TOPIC_APPLIED, event);
    }

    public void publishVerified(WelfareEvent event) {
        publish("beneficiary-verified", event);
    }

    public void publishApproved(WelfareEvent event) {
        publish(TOPIC_APPROVED, event);
    }

    public void publishRejected(WelfareEvent event) {
        publish(TOPIC_REJECTED, event);
    }

    public void publishDisbursed(WelfareEvent event) {
        publish(TOPIC_DISBURSED, event);
        publish("fund-disbursed", event);
    }

    public void publishSchemeCreated(Object payload) {
        publish("scheme-created", payload);
    }

    public void publishPaymentCompleted(WelfareEvent event) {
        publish("payment-completed", event);
    }

    public void publishBudgetAlert(String department, String fiscalYear, double utilizationPercent) {
        var alertPayload = java.util.Map.of(
            "eventType", "BUDGET_THRESHOLD_ALERT",
            "department", department,
            "fiscalYear", fiscalYear,
            "utilizationPercent", utilizationPercent,
            "timestamp", java.time.LocalDateTime.now().toString()
        );
        publish(TOPIC_ALERT, alertPayload);
        publish("budget-alert", alertPayload);
    }

    private void publish(String topic, Object payload) {
        try {
            kafkaTemplate.send(topic, payload);
            log.info("Published Kafka event to topic '{}': {}", topic, payload);
        } catch (Exception e) {
            log.warn("Failed to publish Kafka event to topic '{}': {}", topic, e.getMessage());
        }
    }
}
