package com.civicpulse.citizen_service.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

/**
 * Calls Keycloak Admin REST API to create users and assign roles.
 * Uses the admin account to get a management token, then performs user operations.
 */
@Service
public class KeycloakAdminService {

    @Value("${keycloak.admin.server-url}")
    private String serverUrl;

    @Value("${keycloak.admin.realm}")
    private String realm;

    @Value("${keycloak.admin.username}")
    private String adminUsername;

    @Value("${keycloak.admin.password}")
    private String adminPassword;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Obtain an admin access token from Keycloak master realm.
     */
    private String getAdminToken() {
        String tokenUrl = serverUrl + "/realms/master/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "password");
        body.add("client_id", "admin-cli");
        body.add("username", adminUsername);
        body.add("password", adminPassword);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(tokenUrl, request, Map.class);
        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("Failed to obtain Keycloak admin token");
        }
        return (String) response.get("access_token");
    }

    /**
     * Create a Keycloak user in the civicpulse realm.
     * Returns the new user's Keycloak ID.
     */
    public String createKeycloakUser(String email, String name, String password) {
        String adminToken = getAdminToken();
        String createUserUrl = serverUrl + "/admin/realms/" + realm + "/users";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(adminToken);

        Map<String, Object> userRep = new HashMap<>();
        userRep.put("username", email);
        userRep.put("email", email);
        userRep.put("firstName", name.contains(" ") ? name.substring(0, name.indexOf(' ')) : name);
        userRep.put("lastName", name.contains(" ") ? name.substring(name.indexOf(' ') + 1) : "Citizen");
        userRep.put("enabled", true);
        userRep.put("emailVerified", true);
        userRep.put("requiredActions", List.of());

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(userRep, headers);

        ResponseEntity<Void> response = restTemplate.postForEntity(createUserUrl, request, Void.class);

        if (response.getStatusCode() != HttpStatus.CREATED) {
            throw new RuntimeException("Failed to create Keycloak user. Status: " + response.getStatusCode());
        }

        // Extract the user ID from the Location header
        String location = response.getHeaders().getFirst("Location");
        if (location == null) {
            throw new RuntimeException("Keycloak did not return user ID in Location header");
        }
        String userId = location.substring(location.lastIndexOf('/') + 1);

        // Explicitly set the password
        String resetPasswordUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/reset-password";
        Map<String, Object> credential = new HashMap<>();
        credential.put("type", "password");
        credential.put("value", password);
        credential.put("temporary", false);

        restTemplate.exchange(resetPasswordUrl, HttpMethod.PUT, new HttpEntity<>(credential, headers), Void.class);

        return userId;
    }

    /**
     * Assign a realm role (e.g. "CITIZEN") to a user by userId.
     */
    public void assignRealmRole(String userId, String roleName) {
        String adminToken = getAdminToken();

        // Step 1: Fetch the role representation
        String roleUrl = serverUrl + "/admin/realms/" + realm + "/roles/" + roleName;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        @SuppressWarnings("unchecked")
        Map<String, Object> role = restTemplate.exchange(
            roleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class
        ).getBody();

        if (role == null) {
            throw new RuntimeException("Role '" + roleName + "' not found in realm '" + realm + "'");
        }

        // Step 2: Assign the role to the user
        String assignUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId + "/role-mappings/realm";
        headers.setContentType(MediaType.APPLICATION_JSON);

        restTemplate.postForEntity(assignUrl, new HttpEntity<>(List.of(role), headers), Void.class);
    }

    /**
     * Delete a Keycloak user by userId (used for rollback if DB save fails).
     */
    public void deleteKeycloakUser(String userId) {
        try {
            String adminToken = getAdminToken();
            String deleteUrl = serverUrl + "/admin/realms/" + realm + "/users/" + userId;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(adminToken);
            restTemplate.exchange(deleteUrl, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
        } catch (Exception e) {
            // Log but don't rethrow — rollback is best-effort
            org.slf4j.LoggerFactory.getLogger(KeycloakAdminService.class)
                .warn("Failed to delete Keycloak user {} during rollback: {}", userId, e.getMessage());
        }
    }

    /**
     * Check if a user with given email already exists in Keycloak.
     */
    public boolean userExists(String email) {
        String adminToken = getAdminToken();
        String searchUrl = serverUrl + "/admin/realms/" + realm + "/users?email=" + email + "&exact=true";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> users = restTemplate.exchange(
            searchUrl, HttpMethod.GET, new HttpEntity<>(headers), List.class
        ).getBody();

        return users != null && !users.isEmpty();
    }
}
