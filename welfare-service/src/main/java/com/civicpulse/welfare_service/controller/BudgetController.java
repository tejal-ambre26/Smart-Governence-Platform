package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.Budget;
import com.civicpulse.welfare_service.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/welfare/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    public ResponseEntity<Budget> create(@Valid @RequestBody Budget budget) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.create(budget));
    }

    @GetMapping
    public ResponseEntity<List<Budget>> getAll() {
        return ResponseEntity.ok(budgetService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Budget> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(budgetService.getById(id));
    }

    @PutMapping("/{id}/allocate")
    public ResponseEntity<Budget> adjustAllocation(@PathVariable UUID id,
                                                    @RequestBody Map<String, Object> body) {
        BigDecimal newAllocated = new BigDecimal(body.get("totalAllocated").toString());
        return ResponseEntity.ok(budgetService.adjustAllocation(id, newAllocated));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Budget>> getAlerts() {
        return ResponseEntity.ok(budgetService.getAlerts());
    }
}
