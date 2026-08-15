package com.civicpulse.citizen_service.repository;

import com.civicpulse.citizen_service.entity.Citizen;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CitizenRepository extends JpaRepository<Citizen, UUID> {
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
    java.util.Optional<Citizen> findByEmail(String email);
}