package com.civicpulse.citizen_service.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import com.civicpulse.citizen_service.dto.PublicRegisterDTO;
import com.civicpulse.citizen_service.entity.Citizen;
import com.civicpulse.citizen_service.event.CitizenEvent;
import com.civicpulse.citizen_service.repository.CitizenRepository;
import com.civicpulse.citizen_service.service.KeycloakAdminService;

import jakarta.validation.Valid;

/**
 * Public registration controller — no JWT required.
 * Creates both a Keycloak user account and a citizen profile in one step.
 */
@RestController
@RequestMapping("/api/citizens/auth")
public class PublicRegistrationController {

    private static final Logger log = LoggerFactory.getLogger(PublicRegistrationController.class);
    private static final String TOPIC_CITIZEN_REGISTERED = "citizen-registered";

    private final CitizenRepository citizenRepository;
    private final KeycloakAdminService keycloakAdminService;
    private final KafkaTemplate<String, CitizenEvent> kafkaTemplate;

    public PublicRegistrationController(CitizenRepository citizenRepository,
                                         KeycloakAdminService keycloakAdminService,
                                         KafkaTemplate<String, CitizenEvent> kafkaTemplate) {
        this.citizenRepository = citizenRepository;
        this.keycloakAdminService = keycloakAdminService;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * POST /api/citizens/auth/register
     * Public endpoint — called from the React registration form.
     * 1. Validates that email/phone is not already registered
     * 2. Creates Keycloak user with CITIZEN role
     * 3. Saves citizen profile in PostgreSQL (citizenId = Keycloak subject UUID)
     * 4. Publishes CitizenEvent to Kafka "citizen-registered" topic
     * 5. On DB failure: rolls back the Keycloak user (best-effort delete)
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerCitizen(@Valid @RequestBody PublicRegisterDTO dto) {
        // Check if email already exists in our DB
        if (citizenRepository.existsByEmail(dto.email)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "An account with this email already exists. Please login."));
        }

        // Check if phone number already exists in our DB
        if (citizenRepository.existsByPhoneNumber(dto.phoneNumber)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "An account with this phone number already exists."));
        }

        // Check if email already exists in Keycloak
        if (keycloakAdminService.userExists(dto.email)) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "This email is already registered in the system. Please login."));
        }

        String keycloakUserId = null;
        try {
            // Step 1: Create Keycloak user and get the Keycloak user UUID
            keycloakUserId = keycloakAdminService.createKeycloakUser(
                dto.email, dto.name, dto.password
            );

            // Step 2: Assign CITIZEN role in Keycloak
            keycloakAdminService.assignRealmRole(keycloakUserId, "CITIZEN");

            // Step 3: Save citizen profile in DB using Keycloak UUID as citizenId
            Citizen citizen = new Citizen();
            citizen.citizenId = UUID.fromString(keycloakUserId);
            citizen.name = dto.name;
            citizen.email = dto.email;
            citizen.phoneNumber = dto.phoneNumber;
            citizen.aadhar = (dto.aadhar == null || dto.aadhar.isBlank()) ? null : dto.aadhar;
            citizen.address = dto.address;
            citizen.ward = dto.ward;
            citizen.city = dto.city;
            citizen.state = (dto.state == null || dto.state.isBlank()) ? "India" : dto.state;
            citizen.pincode = dto.pincode;

            citizenRepository.save(citizen);

            // Step 4: Publish Kafka event to citizen-registered topic
            CitizenEvent event = new CitizenEvent(
                "REGISTERED",
                UUID.fromString(keycloakUserId),
                dto.name,
                dto.email,
                LocalDateTime.now()
            );
            kafkaTemplate.send(TOPIC_CITIZEN_REGISTERED, keycloakUserId, event);
            log.info("Published citizen-registered event for citizenId={}", keycloakUserId);

            return ResponseEntity.ok(Map.of(
                "message", "Registration successful! You can now login with your email and password.",
                "citizenId", keycloakUserId
            ));

        } catch (Exception e) {
            log.error("Registration failed for email={}: {}", dto.email, e.getMessage());

            // Rollback: delete the Keycloak user if DB save failed
            if (keycloakUserId != null) {
                log.warn("Rolling back Keycloak user {} due to registration failure", keycloakUserId);
                keycloakAdminService.deleteKeycloakUser(keycloakUserId);
            }

            String userMessage = e.getMessage() != null && e.getMessage().contains("phone_number")
                ? "An account with this phone number already exists."
                : e.getMessage() != null && e.getMessage().contains("email")
                ? "An account with this email already exists."
                : "Registration failed. Please check your details and try again.";

            return ResponseEntity.status(500)
                .body(Map.of("message", userMessage));
        }
    }
}
