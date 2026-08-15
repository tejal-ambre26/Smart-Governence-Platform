package com.civicpulse.welfare_service.config;

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
            .cors(AbstractHttpConfigurer::disable) // CORS is handled centrally by API Gateway (port 8080)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()

                // ── Scheme Management ────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/welfare/schemes").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/schemes/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/schemes/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/welfare/schemes").authenticated()

                // ── Beneficiary Management & Officer Actions ─────────────
                .requestMatchers(HttpMethod.POST, "/api/welfare/schemes/*/apply").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/beneficiaries/citizen/**").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/beneficiaries/department/**").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/beneficiaries/pending").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/beneficiaries/recommended").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/review").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/start-verification").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/bank-verify").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/recommend").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/reject").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/request-docs").hasAnyRole("OFFICER", "DEPARTMENT_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/approve").hasAnyRole("APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/beneficiaries/*/execute-dbt").hasAnyRole("ADMIN", "APPROVER", "FINANCE_OFFICER")
                .requestMatchers(HttpMethod.POST, "/api/welfare/beneficiaries/*/resubmit-docs").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/welfare/beneficiaries/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/welfare/beneficiaries/*/history").authenticated()

                // ── Budget Management ─────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/welfare/budgets").hasAnyRole("FINANCE_OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/welfare/budgets/**").hasAnyRole("FINANCE_OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/budgets/alerts").hasAnyRole("FINANCE_OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/budgets/**").hasAnyRole("FINANCE_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/budgets").hasAnyRole("FINANCE_OFFICER", "APPROVER", "AUTHORITY", "ADMIN")

                // ── Fund Distribution ─────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/welfare/disbursements").hasAnyRole("FINANCE_OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/disbursements/beneficiary/**").hasAnyRole("CITIZEN", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/disbursements/**").hasAnyRole("FINANCE_OFFICER", "ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/welfare/disbursements").hasAnyRole("FINANCE_OFFICER", "ADMIN")

                // ── Expenses, Audit Logs & Receipts ───────────────────────
                .requestMatchers("/api/welfare/expenses/**").hasAnyRole("ADMIN", "FINANCE_OFFICER")
                .requestMatchers("/api/welfare/audit-logs/**").hasAnyRole("ADMIN")
                .requestMatchers("/api/welfare/receipts/**").authenticated()

                // ── Dashboard ─────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/welfare/dashboard/stats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/welfare/dashboard/**").hasAnyRole("ADMIN", "APPROVER", "AUTHORITY", "FINANCE_OFFICER")

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
