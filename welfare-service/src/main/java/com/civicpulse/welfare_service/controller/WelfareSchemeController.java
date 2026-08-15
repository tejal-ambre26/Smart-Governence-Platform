package com.civicpulse.welfare_service.controller;

import com.civicpulse.welfare_service.entity.WelfareScheme;
import com.civicpulse.welfare_service.service.WelfareSchemeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/welfare/schemes")
public class WelfareSchemeController {

    private final WelfareSchemeService schemeService;

    public WelfareSchemeController(WelfareSchemeService schemeService) {
        this.schemeService = schemeService;
    }

    @PostMapping
    public ResponseEntity<WelfareScheme> createScheme(@Valid @RequestBody WelfareScheme scheme) {
        return ResponseEntity.status(HttpStatus.CREATED).body(schemeService.createScheme(scheme));
    }

    @GetMapping
    public ResponseEntity<List<WelfareScheme>> getAllSchemes(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            if ("ACTIVE".equalsIgnoreCase(status)) {
                return ResponseEntity.ok(schemeService.getActiveSchemes());
            }
        }
        return ResponseEntity.ok(schemeService.getAllSchemes());
    }

    @GetMapping("/{id}")
    public ResponseEntity<WelfareScheme> getSchemeById(@PathVariable UUID id) {
        return ResponseEntity.ok(schemeService.getSchemeById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WelfareScheme> updateScheme(@PathVariable UUID id,
                                                       @Valid @RequestBody WelfareScheme scheme) {
        return ResponseEntity.ok(schemeService.updateScheme(id, scheme));
    }
}
