package com.civicpulse.servicemanagement.dto;

import java.math.BigDecimal;
import java.util.Map;

public class RevenueSummaryResponse {

    private BigDecimal totalFeesCollected;
    private Map<String, BigDecimal> feesByServiceType;
    private long applicationsWithFeesCollected;

    public RevenueSummaryResponse() {}

    public RevenueSummaryResponse(BigDecimal totalFeesCollected,
                                  Map<String, BigDecimal> feesByServiceType,
                                  long applicationsWithFeesCollected) {
        this.totalFeesCollected = totalFeesCollected;
        this.feesByServiceType = feesByServiceType;
        this.applicationsWithFeesCollected = applicationsWithFeesCollected;
    }

    public BigDecimal getTotalFeesCollected() { return totalFeesCollected; }
    public void setTotalFeesCollected(BigDecimal totalFeesCollected) { this.totalFeesCollected = totalFeesCollected; }

    public Map<String, BigDecimal> getFeesByServiceType() { return feesByServiceType; }
    public void setFeesByServiceType(Map<String, BigDecimal> feesByServiceType) { this.feesByServiceType = feesByServiceType; }

    public long getApplicationsWithFeesCollected() { return applicationsWithFeesCollected; }
    public void setApplicationsWithFeesCollected(long applicationsWithFeesCollected) { this.applicationsWithFeesCollected = applicationsWithFeesCollected; }
}
