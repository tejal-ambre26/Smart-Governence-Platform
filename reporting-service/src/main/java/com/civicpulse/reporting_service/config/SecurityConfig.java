package com.civicpulse.reporting_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                // Feedback: citizens can submit, admin can view averages
                .requestMatchers(HttpMethod.POST, "/api/reports/feedback").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/reports/feedback/average").hasRole("ADMIN")
                // Audit logs: ADMIN only — most sensitive cross-department data
                .requestMatchers(HttpMethod.GET, "/api/reports/audit-logs/entity/**").hasAnyRole("ADMIN", "APPROVER")
                .requestMatchers(HttpMethod.GET, "/api/reports/audit-logs").hasRole("ADMIN")
                // Governance summary — ADMIN only executive view
                .requestMatchers(HttpMethod.GET, "/api/reports/governance/**").hasRole("ADMIN")
                // AI Governance Intelligence — permitAll (key remains 100% secure in backend env)
                .requestMatchers(HttpMethod.POST, "/api/ai/governance/**").permitAll()
                // Specific report endpoints — ADMIN only (or FINANCE_OFFICER for revenue)
                .requestMatchers(HttpMethod.GET, "/api/reports/citizens").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/reports/grievances").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/reports/revenue").hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.GET, "/api/reports/performance").hasRole("ADMIN")
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(
                jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter())))
            .build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess == null) return List.of();
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) realmAccess.get("roles");
            if (roles == null) return List.of();
            return roles.stream()
                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                .collect(Collectors.toList());
        });
        return converter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
