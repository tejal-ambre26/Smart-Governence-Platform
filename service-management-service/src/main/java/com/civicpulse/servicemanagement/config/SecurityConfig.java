package com.civicpulse.servicemanagement.config;

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
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                // Citizen endpoints
                .requestMatchers(HttpMethod.POST, "/api/services/apply").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/citizen/**").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/download/**").hasAnyRole("CITIZEN", "ADMIN")
                // Officer endpoints
                .requestMatchers(HttpMethod.PUT, "/api/services/verify/**").hasAnyRole("OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/services/approve/**").hasAnyRole("OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/services/reject/**").hasAnyRole("OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/pending").hasAnyRole("OFFICER", "ADMIN")
                // Revenue summary & dashboard stats — accessible for reporting aggregation
                .requestMatchers(HttpMethod.GET, "/api/services/revenue/summary").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/services/dashboard/stats").permitAll()
                // Admin endpoints
                .requestMatchers(HttpMethod.GET, "/api/services/stats").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services").hasAnyRole("OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/status/**").hasAnyRole("OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/services/type/**").hasAnyRole("OFFICER", "ADMIN")
                // Any single application view
                .requestMatchers(HttpMethod.GET, "/api/services/{id}").authenticated()
                // Officer CRUD endpoints
                .requestMatchers("/api/officers/**").hasRole("ADMIN")
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
}
