package com.civicpulse.grievance_service.controller;

import com.civicpulse.grievance_service.entity.Officer;
import com.civicpulse.grievance_service.repository.OfficerRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/officers")
public class OfficerController {

    private final OfficerRepository officerRepository;

    public OfficerController(OfficerRepository officerRepository) {
        this.officerRepository = officerRepository;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Officer> create(@Valid @RequestBody Officer officer) {
        return ResponseEntity.ok(officerRepository.save(officer));
    }

    // READ - Get all officers
    @GetMapping
    public ResponseEntity<List<Officer>> getAll() {
        return ResponseEntity.ok(officerRepository.findAll());
    }

    // READ - Get officer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Officer> getById(@PathVariable UUID id) {
        return officerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ - Get all officers in a department
    @GetMapping("/department/{deptName}")
    public ResponseEntity<List<Officer>> getByDepartment(@PathVariable String deptName) {
        return ResponseEntity.ok(officerRepository.findByDepartmentIgnoreCase(deptName));
    }

    // UPDATE - Update officer details
    @PutMapping("/{id}")
    public ResponseEntity<Officer> update(@PathVariable UUID id,
                                          @Valid @RequestBody Officer updated) {
        return officerRepository.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDepartment(updated.getDepartment());
                    existing.setEmail(updated.getEmail());
                    existing.setPhoneNumber(updated.getPhoneNumber());
                    existing.setSeniorOfficer(updated.isSeniorOfficer());
                    return ResponseEntity.ok(officerRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!officerRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        officerRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
