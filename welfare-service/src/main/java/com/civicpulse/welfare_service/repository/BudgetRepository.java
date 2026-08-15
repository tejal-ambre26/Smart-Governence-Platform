package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    List<Budget> findByDepartment(String department);
    List<Budget> findByFiscalYear(String fiscalYear);
}
