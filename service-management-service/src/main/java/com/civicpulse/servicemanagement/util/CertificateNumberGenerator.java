package com.civicpulse.servicemanagement.util;

import com.civicpulse.servicemanagement.entity.ServiceType;
import org.springframework.stereotype.Component;
import java.time.Year;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class CertificateNumberGenerator {
    private final AtomicLong counter = new AtomicLong(1);

    public String generate(ServiceType serviceType) {
        String prefix = switch (serviceType) {
            case BIRTH_CERTIFICATE             -> "BC";
            case DEATH_CERTIFICATE             -> "DC";
            case INCOME_CERTIFICATE            -> "IC";
            case RESIDENCE_CERTIFICATE         -> "RC";
            case TRADE_LICENSE                 -> "TL";
            case PERMIT_APPROVAL               -> "PA";
            case COMMUNITY_CERTIFICATE         -> "CC";
            case BUILDING_PERMIT               -> "BP";
            case ROAD_CUTTING_PERMIT           -> "RCP";
            case WATER_CONNECTION_PERMIT       -> "WCP";
            case ELECTRICITY_CONNECTION_PERMIT -> "ECP";
            case PUBLIC_EVENT_PERMIT           -> "PEP";
        };
        int year = Year.now().getValue();
        long seq = counter.getAndIncrement();
        return String.format("%s-%d-%04d", prefix, year, seq);
    }
}
