package com.civicpulse.welfare_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootApplication
@EnableDiscoveryClient
public class WelfareServiceApplication {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void dropOldConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE beneficiaries DROP CONSTRAINT IF EXISTS beneficiaries_status_check;");
            jdbcTemplate.execute("ALTER TABLE beneficiary_history DROP CONSTRAINT IF EXISTS beneficiary_history_new_status_check;");
            jdbcTemplate.execute("ALTER TABLE beneficiary_history DROP CONSTRAINT IF EXISTS beneficiary_history_previous_status_check;");
            System.out.println("Successfully dropped outdated status check constraints.");
        } catch (Exception e) {
            System.err.println("Could not drop constraint: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        SpringApplication.run(WelfareServiceApplication.class, args);
    }
}
