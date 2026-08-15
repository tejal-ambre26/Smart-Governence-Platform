package com.civicpulse.servicemanagement.util;

import com.civicpulse.servicemanagement.repository.ApplicationRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class ApplicationNumberGenerator {
    private final AtomicLong counter = new AtomicLong(1);
    private final ApplicationRepository repository;

    public ApplicationNumberGenerator(ApplicationRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        long maxSeq = 0;
        for (com.civicpulse.servicemanagement.entity.ServiceApplication app : repository.findAll()) {
            if (app.getApplicationNumber() != null && app.getApplicationNumber().startsWith("APP-")) {
                try {
                    String[] parts = app.getApplicationNumber().split("-");
                    if (parts.length == 3) {
                        long seq = Long.parseLong(parts[2]);
                        if (seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                } catch (Exception e) {
                    // ignore parse errors
                }
            }
        }
        counter.set(maxSeq + 1);
    }

    public String generate() {
        int year = Year.now().getValue();
        long seq = counter.getAndIncrement();
        return String.format("APP-%d-%04d", year, seq);
    }
}
