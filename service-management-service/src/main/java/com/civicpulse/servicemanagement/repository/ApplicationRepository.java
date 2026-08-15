package com.civicpulse.servicemanagement.repository;

import com.civicpulse.servicemanagement.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<ServiceApplication, UUID> {
    List<ServiceApplication> findByCitizenId(String citizenId);
    List<ServiceApplication> findByStatus(ApplicationStatus status);
    List<ServiceApplication> findByServiceType(ServiceType serviceType);
    
    java.util.Optional<ServiceApplication> findFirstByServiceTypeAndAadhaarNumberAndStatusIn(
            ServiceType serviceType, String aadhaarNumber, List<ApplicationStatus> statuses);

    List<ServiceApplication> findByDepartment(String department);
    List<ServiceApplication> findByDepartmentOrderByAppliedDateDesc(String department);

    // Revenue queries
    List<ServiceApplication> findByFeeCollectedTrue();
}
