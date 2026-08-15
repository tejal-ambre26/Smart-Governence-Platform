package com.civicpulse.notification_service.consumer;

import com.civicpulse.notification_service.dto.ApplicationEvent;
import com.civicpulse.notification_service.dto.ComplaintEvent;
import com.civicpulse.notification_service.dto.WelfareEvent;
import com.civicpulse.notification_service.entity.Notification;
import com.civicpulse.notification_service.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class KafkaConsumerService {

    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public KafkaConsumerService(NotificationRepository notificationRepository, ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    // ────────────────────────────────────────────────────────────────────────
    // CERTIFICATE EVENTS
    // ────────────────────────────────────────────────────────────────────────

    @KafkaListener(topics = "certificate-submitted", groupId = "notification-group")
    public void consumeCertificateSubmitted(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            // Notify citizen
            if (event.getCitizenId() != null) {
                String serviceName = event.getServiceType() != null ? event.getServiceType().replace("_", " ") : "Certificate";
                saveNotification(event.getCitizenId(), "Application Submitted",
                        "Your application " + event.getApplicationNumber() + " for " + serviceName + 
                        " has been submitted successfully and assigned to " + event.getDepartment() + " for verification.",
                        event.getApplicationId(), "CERTIFICATE", "certificate-submitted", "CITIZEN");
            }
            // Notify all officers in the department
            notifyDepartmentOfficers(event.getDepartment(), 
                    "New Certificate Assigned", 
                    "Application " + event.getApplicationNumber() + " requires verification.", 
                    event.getApplicationId(), 
                    "CERTIFICATE",
                    "certificate-submitted");
        } catch (Exception e) {
            System.err.println("Failed to process certificate-submitted: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "application-under-verification", groupId = "notification-group")
    public void consumeApplicationUnderVerification(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Application Under Verification",
                    "Your certificate application " + event.getApplicationNumber() + " is currently under verification.",
                    event.getApplicationId(), "CERTIFICATE", "application-under-verification", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process application-under-verification: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "additional-information-requested", groupId = "notification-group")
    public void consumeAdditionalInfoRequested(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Action Required",
                    "Please upload additional documents for application " + event.getApplicationNumber() + ". Remarks: " + event.getRemarks(),
                    event.getApplicationId(), "CERTIFICATE", "additional-information-requested", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process additional-information-requested: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "certificate-approved", groupId = "notification-group")
    public void consumeCertificateApproved(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Certificate Approved",
                    "Your certificate application " + event.getApplicationNumber() + " has been approved.",
                    event.getApplicationId(), "CERTIFICATE", "certificate-approved", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process certificate-approved: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "certificate-generated", groupId = "notification-group")
    public void consumeCertificateGenerated(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Certificate Generated",
                    "Your certificate is ready for download (App No: " + event.getApplicationNumber() + ").",
                    event.getApplicationId(), "CERTIFICATE", "certificate-generated", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process certificate-generated: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "certificate-rejected", groupId = "notification-group")
    public void consumeCertificateRejected(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Application Rejected",
                    "Your application " + event.getApplicationNumber() + " was rejected. Reason: " + event.getRemarks(),
                    event.getApplicationId(), "CERTIFICATE", "certificate-rejected", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process certificate-rejected: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "certificate-downloaded", groupId = "notification-group")
    public void consumeCertificateDownloaded(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            saveNotification(event.getCitizenId(), "Certificate Downloaded",
                    "Official PDF certificate for application " + event.getApplicationNumber() + " was downloaded successfully.",
                    event.getApplicationId(), "CERTIFICATE", "certificate-downloaded", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process certificate-downloaded: " + e.getMessage());
        }
    }
    
    @KafkaListener(topics = "application-resubmitted", groupId = "notification-group")
    public void consumeApplicationResubmitted(String message) {
        try {
            ApplicationEvent event = objectMapper.readValue(message, ApplicationEvent.class);
            notifyDepartmentOfficers(event.getDepartment(), 
                    "Application Resubmitted", 
                    "Application " + event.getApplicationNumber() + " was resubmitted with new documents.", 
                    event.getApplicationId(), 
                    "CERTIFICATE",
                    "application-resubmitted");
                    
            saveNotification(event.getCitizenId(), "Application Resubmitted",
                    "Documents uploaded successfully. Your application " + event.getApplicationNumber() + " has been resubmitted for verification.",
                    event.getApplicationId(), "CERTIFICATE", "application-resubmitted", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process application-resubmitted: " + e.getMessage());
        }
    }


    // ────────────────────────────────────────────────────────────────────────
    // COMPLAINT EVENTS
    // ────────────────────────────────────────────────────────────────────────

    @KafkaListener(topics = "complaint-submitted", groupId = "notification-group")
    public void consumeComplaintSubmitted(String message) {
        try {
            ComplaintEvent event = objectMapper.readValue(message, ComplaintEvent.class);
            
            System.out.println("DEBUG: Event Consumed from complaint-submitted. Complaint ID=" + event.getComplaintId());
            
            String formattedMessage = "Your complaint has been submitted successfully.\n\n" +
                                      "Complaint ID: " + event.getComplaintId() + "\n" +
                                      "Department: " + (event.getDepartment() != null ? event.getDepartment() : "N/A") + "\n" +
                                      "Status: Submitted";
                                      
            // Notify Citizen
            saveNotification(event.getCitizenId(), "Complaint Submitted Successfully",
                    formattedMessage,
                    event.getComplaintId(), "COMPLAINT", "complaint-submitted", "CITIZEN");
                    
            System.out.println("DEBUG: Notification Saved to Database & Sent to User: " + event.getCitizenId());
        } catch (Exception e) {
            System.err.println("Failed to process complaint-submitted: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "complaint-assigned", groupId = "notification-group")
    public void consumeComplaintAssigned(String message) {
        try {
            ComplaintEvent event = objectMapper.readValue(message, ComplaintEvent.class);
            
            // Notify Officer
            if (event.getAssignedOfficer() != null) {
                saveNotification(event.getAssignedOfficer(), "New Complaint Assigned",
                        "A new complaint has been assigned to you. Please investigate.",
                        event.getComplaintId(), "COMPLAINT", "complaint-assigned-officer", "OFFICER");
            }
            
            // Notify Citizen
            saveNotification(event.getCitizenId(), "Complaint Assigned",
                    "Your complaint has been assigned to an officer and will be investigated shortly.",
                    event.getComplaintId(), "COMPLAINT", "complaint-assigned", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process complaint-assigned: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "complaint-in-progress", groupId = "notification-group")
    public void consumeComplaintInProgress(String message) {
        try {
            ComplaintEvent event = objectMapper.readValue(message, ComplaintEvent.class);
            saveNotification(event.getCitizenId(), "Complaint In Progress",
                    "Work has started on your complaint. We will notify you once it's resolved.",
                    event.getComplaintId(), "COMPLAINT", "complaint-in-progress", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process complaint-in-progress: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "complaint-resolved", groupId = "notification-group")
    public void consumeComplaintResolved(String message) {
        try {
            ComplaintEvent event = objectMapper.readValue(message, ComplaintEvent.class);
            saveNotification(event.getCitizenId(), "Complaint Resolved",
                    "Your complaint has been successfully resolved. " + (event.getRemarks() != null ? "Remarks: " + event.getRemarks() : ""),
                    event.getComplaintId(), "COMPLAINT", "complaint-resolved", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process complaint-resolved: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "complaint-escalated", groupId = "notification-group")
    public void consumeComplaintEscalated(String message) {
        try {
            ComplaintEvent event = objectMapper.readValue(message, ComplaintEvent.class);
            saveNotification("admin", "Complaint Escalated Alert",
                    "Complaint " + (event.getComplaintId() != null ? event.getComplaintId() : "") + " has breached SLA deadline and requires immediate administrative attention.",
                    event.getComplaintId(), "COMPLAINT", "complaint-escalated", "ADMIN");
        } catch (Exception e) {
            System.err.println("Failed to process complaint-escalated: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "budget-threshold-alert", groupId = "notification-group")
    public void consumeBudgetThresholdAlert(String message) {
        try {
            saveNotification("admin", "Budget Threshold Alert",
                    "Welfare budget utilization has exceeded normal operating threshold. Please review fund allocations.",
                    "BUDGET", "WELFARE", "budget-threshold-alert", "ADMIN");
        } catch (Exception e) {
            System.err.println("Failed to process budget-threshold-alert: " + e.getMessage());
        }
    }


    // ────────────────────────────────────────────────────────────────────────
    // WELFARE EVENTS (Milestone 3 - 10 Core Notifications)
    // ────────────────────────────────────────────────────────────────────────

    @KafkaListener(topics = "beneficiary-applied", groupId = "notification-group")
    public void consumeBeneficiaryApplied(String message) {
        try {
            WelfareEvent event = objectMapper.readValue(message, WelfareEvent.class);
            if ("BENEFICIARY_RESUBMITTED".equals(event.getEventType())) {
                notifyDepartmentOfficers(event.getDepartment(), "Documents Resubmitted", 
                    "Applicant has uploaded the requested documents.\n\nPlease review the application again.", 
                    event.getBeneficiaryId(), "WELFARE", "beneficiary-resubmitted");
            } else {
                String citizenText = "Your application " + event.getBeneficiaryCode() + " for " + event.getSchemeName() + 
                                     " has been submitted successfully and assigned to the " + event.getDepartment() + " for verification.";
                saveNotification(event.getCitizenId(), "Application Submitted", citizenText, 
                        event.getBeneficiaryId(), "WELFARE", "beneficiary-applied", "CITIZEN");

                notifyDepartmentOfficers(event.getDepartment(), "New Application Assigned", 
                    "A new welfare application has been assigned to your department.\n\nApplication:\n" + event.getBeneficiaryCode(), 
                    event.getBeneficiaryId(), "WELFARE", "beneficiary-applied");
            }
        } catch (Exception e) {
            System.err.println("Failed to process beneficiary-applied: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "beneficiary-verified", groupId = "notification-group")
    public void consumeBeneficiaryVerified(String message) {
        try {
            WelfareEvent event = objectMapper.readValue(message, WelfareEvent.class);
            
            if ("VERIFICATION_STARTED".equals(event.getEventType())) {
                saveNotification(event.getCitizenId(), "Under Verification", 
                    "Your application " + event.getBeneficiaryCode() + " is currently under department verification.", 
                    event.getBeneficiaryId(), "WELFARE", "verification-started", "CITIZEN");
            } else if ("ADDITIONAL_DOCS_REQUESTED".equals(event.getEventType())) {
                saveNotification(event.getCitizenId(), "Additional Documents Requested", 
                    "Additional documents have been requested for your application. Please upload the requested documents within 7 days.", 
                    event.getBeneficiaryId(), "WELFARE", "additional-docs-requested", "CITIZEN");
            } else if ("BENEFICIARY_RECOMMENDED".equals(event.getEventType())) {
                saveNotification(event.getCitizenId(), "Application Recommended", 
                    "Your application has successfully passed department verification and is awaiting administrative approval.", 
                    event.getBeneficiaryId(), "WELFARE", "beneficiary-recommended", "CITIZEN");
                
                saveNotification("admin", "New Recommendation Received", 
                    "A recommended application is awaiting financial approval.", 
                    event.getBeneficiaryId(), "WELFARE", "beneficiary-recommended", "ADMIN");
            }
        } catch (Exception e) {
            System.err.println("Failed to process beneficiary-verified: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "beneficiary-approved", groupId = "notification-group")
    public void consumeBeneficiaryApproved(String message) {
        try {
            WelfareEvent event = objectMapper.readValue(message, WelfareEvent.class);
            saveNotification(event.getCitizenId(), "Application Approved", 
                "Your welfare application has been approved. Fund transfer will be processed shortly.", 
                event.getBeneficiaryId(), "WELFARE", "beneficiary-approved", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process beneficiary-approved: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "beneficiary-rejected", groupId = "notification-group")
    public void consumeBeneficiaryRejected(String message) {
        try {
            WelfareEvent event = objectMapper.readValue(message, WelfareEvent.class);
            saveNotification(event.getCitizenId(), "Application Rejected", 
                "Your application has been rejected.\n\nReason:\n" + (event.getRemarks() != null ? event.getRemarks() : "Criteria not met"), 
                event.getBeneficiaryId(), "WELFARE", "beneficiary-rejected", "CITIZEN");
        } catch (Exception e) {
            System.err.println("Failed to process beneficiary-rejected: " + e.getMessage());
        }
    }

    @KafkaListener(topics = {"funds-disbursed", "fund-disbursed"}, groupId = "notification-group")
    public void consumeFundsDisbursed(String message) {
        try {
            WelfareEvent event = objectMapper.readValue(message, WelfareEvent.class);
            
            String citizenText = "Your welfare benefit has been credited to your registered bank account.\n\nTransaction ID:\n" + 
                                 (event.getTransactionId() != null ? event.getTransactionId() : "Pending");
            saveNotification(event.getCitizenId(), "Funds Credited", citizenText, 
                    event.getBeneficiaryId(), "WELFARE", "funds-disbursed", "CITIZEN");
            
            String adminText = "Direct Benefit Transfer completed successfully.\n\nTransaction:\n" + 
                               (event.getTransactionId() != null ? event.getTransactionId() : "Pending");
            saveNotification("admin", "Payment Completed", adminText, 
                    event.getBeneficiaryId(), "WELFARE", "funds-disbursed", "ADMIN");
        } catch (Exception e) {
            System.err.println("Failed to process funds-disbursed: " + e.getMessage());
        }
    }


    // ────────────────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ────────────────────────────────────────────────────────────────────────

    private void saveNotification(String recipient, String title, String message, String relatedEntityId, String relatedEntityType, String eventType, String recipientRole) {
        if (recipient == null || recipient.isBlank()) return;
        Notification notification = new Notification(
                recipient,
                eventType,
                title,
                message,
                relatedEntityId,
                relatedEntityType,
                false,
                recipientRole,
                LocalDateTime.now()
        );
        notificationRepository.save(notification);
        System.out.println("Saved notification to DB for recipient: " + recipient + " [" + title + "]");
    }

    private void notifyDepartmentOfficers(String department, String title, String message, String relatedEntityId, String relatedEntityType, String eventType) {
        if (department == null || department.isBlank()) return;
        
        String username = null;
        if ("Education Department".equalsIgnoreCase(department)) {
            username = "emily";
        } else if ("Social Welfare Department".equalsIgnoreCase(department)) {
            username = "david";
        } else if ("Health Department".equalsIgnoreCase(department)) {
            username = "john";
        }

        if (username != null) {
            saveNotification(username, title, message, relatedEntityId, relatedEntityType, eventType, "OFFICER");
        } else {
            // Fallback: Just notify the department "group"
            saveNotification("department:" + department, title, message, relatedEntityId, relatedEntityType, eventType, "OFFICER");
        }
    }
}
