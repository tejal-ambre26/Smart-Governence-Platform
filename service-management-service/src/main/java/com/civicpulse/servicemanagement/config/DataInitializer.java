package com.civicpulse.servicemanagement.config;

import com.civicpulse.servicemanagement.entity.DepartmentOfficer;
import com.civicpulse.servicemanagement.repository.DepartmentOfficerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

import com.civicpulse.servicemanagement.entity.ServiceApplication;
import com.civicpulse.servicemanagement.repository.ApplicationRepository;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final DepartmentOfficerRepository departmentOfficerRepository;
    private final ApplicationRepository applicationRepository;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(DepartmentOfficerRepository departmentOfficerRepository, ApplicationRepository applicationRepository, JdbcTemplate jdbcTemplate) {
        this.departmentOfficerRepository = departmentOfficerRepository;
        this.applicationRepository = applicationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Altering documents_submitted column type to TEXT if necessary...");
        try {
            jdbcTemplate.execute("ALTER TABLE service_applications ALTER COLUMN documents_submitted TYPE TEXT");
        } catch (Exception e) {
            log.warn("Could not alter documents_submitted column: {}", e.getMessage());
        }

        log.info("Checking and initializing default officers...");

        List<DepartmentOfficer> defaultOfficers = Arrays.asList(
            new DepartmentOfficer("healthofficer.org", "John Officer", "Health Department", "OFFICER"),
            new DepartmentOfficer("revenueofficer.org", "Mark Officer", "Revenue Department", "OFFICER"),
            new DepartmentOfficer("municipalofficer.org", "Ryan Officer", "Municipal Corporation", "OFFICER"),
            new DepartmentOfficer("waterofficer.org", "Chris Officer", "Water Department", "OFFICER"),
            new DepartmentOfficer("roadsofficer.org", "Ethan Officer", "Roads Department", "OFFICER"),
            new DepartmentOfficer("electricityofficer.org", "Jack Officer", "Electricity Department", "OFFICER"),
            new DepartmentOfficer("socialwelfareofficer.org", "David Officer", "Social Welfare", "OFFICER"),
            new DepartmentOfficer("urbanofficer.org", "Will Officer", "Urban Planning Department", "OFFICER"),
            new DepartmentOfficer("educationofficer.org", "Emily Officer", "Education Department", "OFFICER"),
            // Legacy fallbacks for historical records
            new DepartmentOfficer("john", "John Officer", "Health Department", "OFFICER"),
            new DepartmentOfficer("mark", "Mark Officer", "Revenue Department", "OFFICER"),
            new DepartmentOfficer("ryan", "Ryan Officer", "Municipal Corporation", "OFFICER"),
            new DepartmentOfficer("chris", "Chris Officer", "Water Department", "OFFICER"),
            new DepartmentOfficer("ethan", "Ethan Officer", "Roads Department", "OFFICER"),
            new DepartmentOfficer("jack", "Jack Officer", "Electricity Department", "OFFICER"),
            new DepartmentOfficer("david", "David Officer", "Social Welfare", "OFFICER"),
            new DepartmentOfficer("will", "Will Officer", "Urban Planning Department", "OFFICER"),
            new DepartmentOfficer("emily", "Emily Officer", "Education Department", "OFFICER")
        );

        for (DepartmentOfficer officer : defaultOfficers) {
            officer.setEmail(officer.getUsername() + "@muni.gov");
            officer.setPhoneNumber("9100000000");
            officer.setStatus("Active");
            
            departmentOfficerRepository.findByUsername(officer.getUsername()).ifPresentOrElse(
                existingOfficer -> {
                    existingOfficer.setOfficerName(officer.getOfficerName());
                    existingOfficer.setDepartment(officer.getDepartment());
                    existingOfficer.setRole(officer.getRole());
                    existingOfficer.setEmail(officer.getEmail());
                    existingOfficer.setPhoneNumber(officer.getPhoneNumber());
                    existingOfficer.setStatus(officer.getStatus());
                    departmentOfficerRepository.save(existingOfficer);
                    log.info("Updated existing officer: {}", officer.getUsername());
                },
                () -> {
                    departmentOfficerRepository.save(officer);
                    log.info("Created default officer: {} for department: {}", officer.getUsername(), officer.getDepartment());
                }
            );
        }

        // Legacy migration removed to preserve exact department names.
    }
}
