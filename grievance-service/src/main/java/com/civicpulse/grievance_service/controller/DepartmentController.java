package com.civicpulse.grievance_service.controller;

import com.civicpulse.grievance_service.entity.Department;
import com.civicpulse.grievance_service.repository.DepartmentRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    public DepartmentController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Department> create(@Valid @RequestBody Department department) {
        return ResponseEntity.ok(departmentRepository.save(department));
    }

    // READ - Get all departments
    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    // READ - Get department by ID
    @GetMapping("/{id}")
    public ResponseEntity<Department> getById(@PathVariable UUID id) {
        return departmentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE - Update department details
    @PutMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable UUID id,
                                             @Valid @RequestBody Department updated) {
        return departmentRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setHeadOfficerName(updated.getHeadOfficerName());
                    existing.setContactEmail(updated.getContactEmail());
                    existing.setContactPhone(updated.getContactPhone());
                    return ResponseEntity.ok(departmentRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!departmentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        departmentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
