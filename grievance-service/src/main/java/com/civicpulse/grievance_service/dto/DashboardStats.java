package com.civicpulse.grievance_service.dto;

import java.util.Map;

public class DashboardStats {
    private long totalComplaints;
    private long resolvedComplaints;
    private long pendingComplaints;
    private long overdueComplaints;
    private double resolutionRate;
    private Map<String, Long> byDepartment;
    private Map<String, Long> byPriority;
    private Map<String, Long> byStatus;

    public DashboardStats(long totalComplaints, long resolvedComplaints, long pendingComplaints, long overdueComplaints, double resolutionRate, Map<String, Long> byDepartment, Map<String, Long> byPriority, Map<String, Long> byStatus) {
        this.totalComplaints = totalComplaints;
        this.resolvedComplaints = resolvedComplaints;
        this.pendingComplaints = pendingComplaints;
        this.overdueComplaints = overdueComplaints;
        this.resolutionRate = resolutionRate;
        this.byDepartment = byDepartment;
        this.byPriority = byPriority;
        this.byStatus = byStatus;
    }

    public long getTotalComplaints() { return totalComplaints; }
    public long getResolvedComplaints() { return resolvedComplaints; }
    public long getPendingComplaints() { return pendingComplaints; }
    public long getOverdueComplaints() { return overdueComplaints; }
    public double getResolutionRate() { return resolutionRate; }
    public Map<String, Long> getByDepartment() { return byDepartment; }
    public Map<String, Long> getByPriority() { return byPriority; }
    public Map<String, Long> getByStatus() { return byStatus; }
}
