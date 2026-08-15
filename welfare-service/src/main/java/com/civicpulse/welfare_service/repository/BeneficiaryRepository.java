package com.civicpulse.welfare_service.repository;

import com.civicpulse.welfare_service.entity.Beneficiary;
import com.civicpulse.welfare_service.entity.BeneficiaryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, UUID> {
    List<Beneficiary> findByCitizenId(String citizenId);
    List<Beneficiary> findBySchemeId(UUID schemeId);
    List<Beneficiary> findByStatus(BeneficiaryStatus status);
    List<Beneficiary> findByStatusIn(List<BeneficiaryStatus> statuses);
    
    List<Beneficiary> findByAssignedDepartment(String assignedDepartment);
    List<Beneficiary> findByAssignedDepartmentIgnoreCase(String assignedDepartment);
    List<Beneficiary> findByAssignedDepartmentAndStatus(String assignedDepartment, BeneficiaryStatus status);
    List<Beneficiary> findByAssignedOfficer(String assignedOfficer);
    
    Optional<Beneficiary> findFirstBySchemeIdAndApplicantAadhaarAndStatusIn(UUID schemeId, String applicantAadhaar, List<BeneficiaryStatus> statuses);

    @Query("SELECT b FROM Beneficiary b WHERE b.schemeId = :schemeId AND (REPLACE(b.applicantAadhaar, '-', '') = :cleanAadhaar OR b.applicantAadhaar = :rawAadhaar) AND b.status IN :activeStatuses")
    List<Beneficiary> findActiveApplicationsBySchemeAndAadhaar(@Param("schemeId") UUID schemeId,
                                                              @Param("cleanAadhaar") String cleanAadhaar,
                                                              @Param("rawAadhaar") String rawAadhaar,
                                                              @Param("activeStatuses") List<BeneficiaryStatus> activeStatuses);

    @Query("SELECT b FROM Beneficiary b WHERE (REPLACE(b.applicantAadhaar, '-', '') = :cleanAadhaar OR b.applicantAadhaar = :rawAadhaar) AND b.status IN :activeStatuses")
    List<Beneficiary> findActiveApplicationsByAadhaar(@Param("cleanAadhaar") String cleanAadhaar,
                                                     @Param("rawAadhaar") String rawAadhaar,
                                                     @Param("activeStatuses") List<BeneficiaryStatus> activeStatuses);

    long countBySchemeId(UUID schemeId);

    @Query("SELECT MAX(CAST(SUBSTRING(b.beneficiaryCode, 10) AS integer)) FROM Beneficiary b WHERE b.beneficiaryCode LIKE CONCAT('BEN-', :year, '-%')")
    Long findMaxSequenceForYear(@Param("year") int year);
}
