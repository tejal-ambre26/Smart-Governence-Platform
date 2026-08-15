package com.civicpulse.welfare_service.util;

import com.civicpulse.welfare_service.repository.BeneficiaryRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class BeneficiaryCodeGenerator {

    private final AtomicLong counter = new AtomicLong(1);
    private final BeneficiaryRepository repository;

    public BeneficiaryCodeGenerator(BeneficiaryRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        int year = Year.now().getValue();
        Long maxSeq = repository.findMaxSequenceForYear(year);
        counter.set(maxSeq != null ? maxSeq + 1 : 1);
    }

    public String generate() {
        int year = Year.now().getValue();
        long seq = counter.getAndIncrement();
        return String.format("BEN-%d-%04d", year, seq);
    }
}
