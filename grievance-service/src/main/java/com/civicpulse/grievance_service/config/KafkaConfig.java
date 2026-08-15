package com.civicpulse.grievance_service.config;

import com.civicpulse.grievance_service.event.ComplaintEvent;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka producer configuration for the grievance-service.
 *
 * Provides two KafkaTemplate beans:
 *   1. KafkaTemplate<String, String>  — used by KafkaProducerService for legacy notification events
 *   2. KafkaTemplate<String, ComplaintEvent> — used by ComplaintService & EscalationService
 *      for typed complaint events (complaint-created, complaint-status-changed, complaint-escalated)
 */
@Configuration
public class KafkaConfig {

    private Map<String, Object> baseProducerConfig() {
        Map<String, Object> cfg = new HashMap<>();
        cfg.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        cfg.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        cfg.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 5000);
        cfg.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 5000);
        cfg.put(ProducerConfig.RETRIES_CONFIG, 1);
        return cfg;
    }

    // ── String (legacy) producer — used by KafkaProducerService ────────────

    @Bean
    @Primary
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> cfg = baseProducerConfig();
        cfg.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        return new DefaultKafkaProducerFactory<>(cfg);
    }

    @Bean
    @Primary
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // ── Typed ComplaintEvent producer ───────────────────────────────────────

    @Bean
    public ProducerFactory<String, ComplaintEvent> complaintEventProducerFactory() {
        Map<String, Object> cfg = baseProducerConfig();
        JsonSerializer<ComplaintEvent> valueSerializer = new JsonSerializer<>();
        valueSerializer.setAddTypeInfo(false);  // no __TypeId__ headers
        return new DefaultKafkaProducerFactory<>(cfg, new StringSerializer(), valueSerializer);
    }

    @Bean
    public KafkaTemplate<String, ComplaintEvent> complaintEventKafkaTemplate() {
        return new KafkaTemplate<>(complaintEventProducerFactory());
    }
}
