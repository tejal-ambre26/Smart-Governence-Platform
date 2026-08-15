package com.civicpulse.grievance_service.repository;

import com.civicpulse.grievance_service.entity.Officer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OfficerRepository extends JpaRepository<Officer, UUID> {
    List<Officer> findByDepartmentIgnoreCase(String department);
    List<Officer> findByDepartmentIgnoreCaseAndSeniorOfficerTrue(String department);
    java.util.Optional<Officer> findByNameIgnoreCase(String name);
}
