package com.civicpulse.citizen_service.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicpulse.citizen_service.dto.CitizenRequestDTO;
import com.civicpulse.citizen_service.entity.Citizen;
import com.civicpulse.citizen_service.repository.CitizenRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/citizens")
@Validated
public class CitizenController {

    private final CitizenRepository citizenRepository;

    public CitizenController(CitizenRepository citizenRepository) {
        this.citizenRepository = citizenRepository;
    }

    // CREATE - Register a new citizen
    @PostMapping("/register")
    public ResponseEntity<Citizen> registerCitizen(@Valid @RequestBody CitizenRequestDTO citizenDTO) {
        Citizen citizen = new Citizen();
        citizen.name = citizenDTO.name;
        citizen.phoneNumber = citizenDTO.phoneNumber;
        citizen.email = citizenDTO.email;
        citizen.aadhar = citizenDTO.aadhar;
        citizen.address = citizenDTO.address;
        citizen.ward = citizenDTO.ward;
        citizen.city = citizenDTO.city;
        citizen.state = citizenDTO.state;
        citizen.pincode = citizenDTO.pincode;

        Citizen saved = citizenRepository.save(citizen);
        return ResponseEntity.ok(saved);
    }

    // READ - Get all citizens
    @GetMapping
    public ResponseEntity<List<Citizen>> getAllCitizens() {
        return ResponseEntity.ok(citizenRepository.findAll());
    }

    // READ - Get citizen by ID
    @GetMapping("/{id}")
    public ResponseEntity<Citizen> getCitizenById(@PathVariable UUID id) {
        return citizenRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE - Update citizen details
    @PutMapping("/{id}")
    public ResponseEntity<Citizen> updateCitizen(
            @PathVariable UUID id,
            @Valid @RequestBody CitizenRequestDTO citizenDTO) {
        return citizenRepository.findById(id)
                .map(existing -> {
                    existing.name = citizenDTO.name;
                    existing.phoneNumber = citizenDTO.phoneNumber;
                    existing.email = citizenDTO.email;
                    existing.aadhar = citizenDTO.aadhar;
                    existing.address = citizenDTO.address;
                    existing.ward = citizenDTO.ward;
                    existing.city = citizenDTO.city;
                    existing.state = citizenDTO.state;
                    existing.pincode = citizenDTO.pincode;
                    return ResponseEntity.ok(citizenRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE - Delete a citizen by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCitizen(@PathVariable UUID id) {
        if (!citizenRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        citizenRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}