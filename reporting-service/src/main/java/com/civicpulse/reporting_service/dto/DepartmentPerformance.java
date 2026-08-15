package com.civicpulse.reporting_service.dto;

public class DepartmentPerformance {

    private String department;
    private long totalHandled;
    private double resolutionRate;
    private double avgTurnaroundHours;

    public DepartmentPerformance() {}

    public DepartmentPerformance(String department, long totalHandled,
                                  double resolutionRate, double avgTurnaroundHours) {
        this.department = department;
        this.totalHandled = totalHandled;
        this.resolutionRate = resolutionRate;
        this.avgTurnaroundHours = avgTurnaroundHours;
    }

    public String getDepartment() { return department; }
    public long getTotalHandled() { return totalHandled; }
    public double getResolutionRate() { return resolutionRate; }
    public double getAvgTurnaroundHours() { return avgTurnaroundHours; }

    public void setDepartment(String department) { this.department = department; }
    public void setTotalHandled(long totalHandled) { this.totalHandled = totalHandled; }
    public void setResolutionRate(double resolutionRate) { this.resolutionRate = resolutionRate; }
    public void setAvgTurnaroundHours(double avgTurnaroundHours) { this.avgTurnaroundHours = avgTurnaroundHours; }
}
