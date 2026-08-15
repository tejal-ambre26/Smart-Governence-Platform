package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByDepartment(String department);
    List<Expense> findBySchemeId(UUID schemeId);
    List<Expense> findByBeneficiaryId(UUID beneficiaryId);
}
