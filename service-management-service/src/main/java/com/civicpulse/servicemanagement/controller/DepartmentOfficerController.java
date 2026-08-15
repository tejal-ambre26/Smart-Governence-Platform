package com.civicpulse.servicemanagement.controller;

import com.civicpulse.servicemanagement.entity.DepartmentOfficer;
import com.civicpulse.servicemanagement.service.OfficerManagementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/officers")
public class DepartmentOfficerController {

    private final OfficerManagementService officerManagementService;

    public DepartmentOfficerController(OfficerManagementService officerManagementService) {
        this.officerManagementService = officerManagementService;
    }

    @GetMapping
    public ResponseEntity<List<DepartmentOfficer>> getAllOfficers() {
        return ResponseEntity.ok(officerManagementService.getAllOfficers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentOfficer> getOfficerById(@PathVariable UUID id) {
        return officerManagementService.getOfficerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DepartmentOfficer> createOfficer(@RequestBody DepartmentOfficer officer) {
        return ResponseEntity.ok(officerManagementService.createOfficer(officer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentOfficer> updateOfficer(@PathVariable UUID id, @RequestBody DepartmentOfficer updatedData) {
        try {
            return ResponseEntity.ok(officerManagementService.updateOfficer(id, updatedData));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOfficer(@PathVariable UUID id) {
        officerManagementService.deleteOfficer(id);
        return ResponseEntity.noContent().build();
    }
}
