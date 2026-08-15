package com.civicpulse.servicemanagement.service;

import com.civicpulse.servicemanagement.entity.DepartmentOfficer;
import com.civicpulse.servicemanagement.repository.DepartmentOfficerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class OfficerManagementService {

    private static final Logger log = LoggerFactory.getLogger(OfficerManagementService.class);
    private final DepartmentOfficerRepository repository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final String keycloakServer = "http://localhost:8180";
    private final String realm = "civicpulse";
    private final String adminUser = "admin";
    private final String adminPass = "admin";

    public OfficerManagementService(DepartmentOfficerRepository repository) {
        this.repository = repository;
    }

    public List<DepartmentOfficer> getAllOfficers() {
        return repository.findAll();
    }

    public Optional<DepartmentOfficer> getOfficerById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public DepartmentOfficer createOfficer(DepartmentOfficer officer) {
        // 1. Create in Database
        DepartmentOfficer saved = repository.save(officer);

        // 2. Provision in Keycloak
        provisionKeycloakUser(officer.getUsername(), officer.getOfficerName(), officer.getEmail(), officer.getPassword(), officer.getRole());

        return saved;
    }

    @Transactional
    public DepartmentOfficer updateOfficer(UUID id, DepartmentOfficer updatedData) {
        DepartmentOfficer existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Officer not found"));

        existing.setOfficerName(updatedData.getOfficerName());
        existing.setDepartment(updatedData.getDepartment());
        existing.setRole(updatedData.getRole());
        existing.setEmail(updatedData.getEmail());
        existing.setPhoneNumber(updatedData.getPhoneNumber());
        existing.setStatus(updatedData.getStatus());

        return repository.save(existing);
    }

    @Transactional
    public void deleteOfficer(UUID id) {
        repository.deleteById(id);
    }

    private String getAdminToken() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("client_id", "admin-cli");
            map.add("username", adminUser);
            map.add("password", adminPass);
            map.add("grant_type", "password");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    keycloakServer + "/realms/master/protocol/openid-connect/token", request, Map.class);

            return (String) response.getBody().get("access_token");
        } catch (Exception e) {
            log.error("Failed to get Keycloak admin token", e);
            throw new RuntimeException("Keycloak connection failed", e);
        }
    }

    private void provisionKeycloakUser(String username, String name, String email, String password, String roleName) {
        try {
            String token = getAdminToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            String userEmail = (email != null && !email.isBlank()) ? email : (username + "@muni.gov");
            String userPassword = (password != null && !password.isBlank()) ? password : "Password123";
            String keycloakRole = ("SENIOR_OFFICER".equalsIgnoreCase(roleName) || "Senior Officer".equalsIgnoreCase(roleName)) ? "SENIOR_OFFICER" : "OFFICER";

            // Create user
            Map<String, Object> userBody = Map.of(
                    "username", username,
                    "enabled", true,
                    "emailVerified", true,
                    "firstName", name,
                    "email", userEmail,
                    "credentials", List.of(Map.of(
                            "type", "password",
                            "value", userPassword,
                            "temporary", false
                    ))
            );

            HttpEntity<Map<String, Object>> createReq = new HttpEntity<>(userBody, headers);
            ResponseEntity<String> createRes = restTemplate.postForEntity(
                    keycloakServer + "/admin/realms/" + realm + "/users", createReq, String.class);

            if (createRes.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully created Keycloak user: {} with email {}", username, userEmail);
                
                // Fetch userId
                ResponseEntity<List> usersRes = restTemplate.exchange(
                        keycloakServer + "/admin/realms/" + realm + "/users?username=" + username,
                        HttpMethod.GET, new HttpEntity<>(headers), List.class);
                
                if (usersRes.getBody() != null && !usersRes.getBody().isEmpty()) {
                    Map<String, Object> user = (Map<String, Object>) usersRes.getBody().get(0);
                    String userId = (String) user.get("id");

                    // Fetch roleId
                    ResponseEntity<Map> roleRes = restTemplate.exchange(
                            keycloakServer + "/admin/realms/" + realm + "/roles/" + keycloakRole,
                            HttpMethod.GET, new HttpEntity<>(headers), Map.class);
                    
                    if (roleRes.getBody() != null) {
                        Map<String, Object> roleBody = roleRes.getBody();
                        
                        // Assign role
                        HttpEntity<List<Map<String, Object>>> roleReq = new HttpEntity<>(List.of(roleBody), headers);
                        restTemplate.postForEntity(
                                keycloakServer + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm",
                                roleReq, String.class);
                        log.info("Successfully assigned role {} to {}", keycloakRole, username);
                    }
                }
            } else {
                log.warn("Keycloak user creation returned status: {}", createRes.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to provision Keycloak user: {}", username, e);
            // Non-blocking error. Will continue saving in DB.
        }
    }
}
