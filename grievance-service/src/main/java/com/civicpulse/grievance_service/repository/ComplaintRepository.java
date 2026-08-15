package com.civicpulse.grievance_service.repository;

import com.civicpulse.grievance_service.entity.Complaint;
import com.civicpulse.grievance_service.entity.Complaint.ComplaintStatus;
import com.civicpulse.grievance_service.entity.Complaint.Priority;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findByCitizenId(String citizenId);
    List<Complaint> findByAssignedOfficer(String assignedOfficer);
    Page<Complaint> findByAssignedOfficer(String assignedOfficer, Pageable pageable);
    
    java.util.Optional<Complaint> findFirstByCitizenIdAndDepartmentAndTitleAndLocationAndStatusIn(
            String citizenId, String department, String title, String location, List<ComplaintStatus> statuses);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByPriority(Priority priority);

    List<Complaint> findByDepartmentIgnoreCase(String department);
    Page<Complaint> findByDepartmentIgnoreCase(String department, Pageable pageable);

    List<Complaint> findByLocationContainingIgnoreCase(String locationKeyword);

    List<Complaint> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("""
        SELECT c FROM Complaint c
        WHERE (:#{#status == null} = true OR c.status = :status)
        AND (:#{#priority == null} = true OR c.priority = :priority)
        AND (:#{#department == null} = true OR LOWER(c.department) = LOWER(:department))
        AND (:#{#ward == null} = true OR LOWER(c.location) LIKE LOWER(CONCAT('%', :ward, '%')))
    """)
    List<Complaint> searchComplaints(
            @Param("status") ComplaintStatus status,
            @Param("priority") Priority priority,
            @Param("department") String department,
            @Param("ward") String ward
    );
}