package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.Expense;
import com.civicpulse.welfare_service.repository.ExpenseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/welfare/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepo;

    public ExpenseController(ExpenseRepository expenseRepo) {
        this.expenseRepo = expenseRepo;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Expense>> getAllExpenses() {
        return ResponseEntity.ok(expenseRepo.findAll());
    }

    @GetMapping("/department/{dept}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    public ResponseEntity<List<Expense>> getExpensesByDepartment(@PathVariable String dept) {
        return ResponseEntity.ok(expenseRepo.findByDepartment(dept));
    }
}
