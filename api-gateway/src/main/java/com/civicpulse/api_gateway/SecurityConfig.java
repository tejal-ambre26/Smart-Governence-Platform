package com.civicpulse.api_gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * API Gateway JWT Security Configuration (Spring WebMVC / servlet-based).
 *
 * The project uses spring-cloud-starter-gateway-server-webmvc (NOT the reactive
 * WebFlux gateway), so we configure standard HttpSecurity here.
 *
 * All requests require a valid Keycloak JWT except:
 *   - /actuator/health         (liveness check)
 *   - /api/citizens/auth/**    (public self-registration — citizen-service handles further auth)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow all OPTIONS preflight requests globally
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                // Health check — always public
                .requestMatchers("/actuator/**").permitAll()
                // Public registration — citizen creates their own Keycloak account
                .requestMatchers("/api/citizens/auth/register").permitAll()
                // Public dashboard stats
                .requestMatchers("/api/complaints/dashboard/stats", "/api/services/dashboard/stats", "/api/welfare/dashboard/stats").permitAll()
                // AI Governance endpoints — permitAll (backend protects Gemini key)
                .requestMatchers("/api/ai/**").permitAll()
                // Everything else requires a valid JWT
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        return http.build();
    }

    /**
     * Extracts Keycloak realm roles from the JWT and maps them to
     * Spring Security ROLE_xxx authorities.
     */
    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<String> roles = extractRealmRoles(jwt.getClaimAsMap("realm_access"));
            return roles.stream()
                    .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList());
        });
        return converter;
    }

    @SuppressWarnings("unchecked")
    private Collection<String> extractRealmRoles(java.util.Map<String, Object> realmAccess) {
        if (realmAccess == null || !realmAccess.containsKey("roles")) {
            return List.of();
        }
        return (Collection<String>) realmAccess.get("roles");
    }
}
