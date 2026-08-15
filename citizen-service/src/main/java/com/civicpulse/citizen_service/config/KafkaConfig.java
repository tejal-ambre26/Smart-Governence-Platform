package com.civicpulse.citizen_service.config;

import com.civicpulse.citizen_service.event.CitizenEvent;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka producer configuration for citizen-service.
 * Provides the KafkaTemplate<String, CitizenEvent> bean required by PublicRegistrationController.
 */
@Configuration
public class KafkaConfig {

    @Bean
    public ProducerFactory<String, CitizenEvent> citizenEventProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        
        JsonSerializer<CitizenEvent> jsonSerializer = new JsonSerializer<>();
        jsonSerializer.setAddTypeInfo(false); // Do not add __TypeId__ headers
        
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 5000);
        configProps.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 5000);
        configProps.put(ProducerConfig.RETRIES_CONFIG, 1);
        
        return new DefaultKafkaProducerFactory<>(configProps, new StringSerializer(), jsonSerializer);
    }

    @Bean
    public KafkaTemplate<String, CitizenEvent> kafkaTemplate() {
        return new KafkaTemplate<>(citizenEventProducerFactory());
    }
}
