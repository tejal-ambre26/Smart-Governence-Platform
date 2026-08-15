package com.civicpulse.servicemanagement.repository;

import com.civicpulse.servicemanagement.entity.DepartmentOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentOfficerRepository extends JpaRepository<DepartmentOfficer, UUID> {
    Optional<DepartmentOfficer> findByUsername(String username);
}
