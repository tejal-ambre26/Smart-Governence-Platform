package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.SchemeStatus;
import com.civicpulse.welfare_service.entity.WelfareScheme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WelfareSchemeRepository extends JpaRepository<WelfareScheme, UUID> {
    List<WelfareScheme> findByStatus(SchemeStatus status);
    List<WelfareScheme> findByDepartment(String department);
    boolean existsBySchemeName(String schemeName);
    Optional<WelfareScheme> findBySchemeName(String schemeName);
}
