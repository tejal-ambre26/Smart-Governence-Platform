package com.civicpulse.welfare_service.util;

import com.civicpulse.welfare_service.repository.FundDisbursementRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class TransactionIdGenerator {

    private final AtomicLong counter = new AtomicLong(1);
    private final FundDisbursementRepository repository;

    public TransactionIdGenerator(FundDisbursementRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        int year = Year.now().getValue();
        Long maxSeq = repository.findMaxTransactionSequenceForYear(year);
        counter.set(maxSeq != null ? maxSeq + 1 : 1);
    }

    public String generate() {
        int year = Year.now().getValue();
        long seq = counter.getAndIncrement();
        return String.format("TXN-%d-%06d", year, seq);
    }
}
