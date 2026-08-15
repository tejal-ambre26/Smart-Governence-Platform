package com.civicpulse.notification_service.config;

import com.civicpulse.notification_service.entity.Notification;
import com.civicpulse.notification_service.repository.NotificationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final NotificationRepository notificationRepository;

    public DataInitializer(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Override
    public void run(String... args) {
        if (notificationRepository.count() > 0) {
            return;
        }

        System.out.println("Seeding lifecycle notifications for Citizens, Officers, and Admin...");

        List<Notification> initialNotifs = List.of(
            // ── CITIZEN NOTIFICATIONS ──────────────────────────────────────────
            new Notification(
                "citizen1@gmail.com",
                "APPLICATION_SUBMITTED",
                "Application Submitted",
                "Your Income Certificate application (APP-2026-0001) was successfully registered in the Governance Command Center.",
                "APP-2026-0001",
                "CERTIFICATE",
                false,
                "CITIZEN",
                LocalDateTime.now().minusHours(5)
            ),
            new Notification(
                "citizen1@gmail.com",
                "OFFICER_APPROVED",
                "Approved by Officer",
                "Social Welfare Officer David Wilson verified your documents and recommended your application for approval.",
                "APP-2026-0001",
                "CERTIFICATE",
                false,
                "CITIZEN",
                LocalDateTime.now().minusHours(3)
            ),
            new Notification(
                "citizen1@gmail.com",
                "ADMIN_APPROVED",
                "Approved by Admin",
                "Your official Income Certificate (CERT-2026-0001) has been approved by City Admin with digital QR seal.",
                "CERT-2026-0001",
                "CERTIFICATE",
                false,
                "CITIZEN",
                LocalDateTime.now().minusHours(1)
            ),
            new Notification(
                "citizen1@gmail.com",
                "REPORT_DOWNLOADED",
                "Downloaded Your Report",
                "You downloaded official PDF certificate / report (CERT-2026-0001).",
                "CERT-2026-0001",
                "CERTIFICATE",
                false,
                "CITIZEN",
                LocalDateTime.now().minusMinutes(20)
            ),
            new Notification(
                "citizen1@gmail.com",
                "WELFARE_CREDITED",
                "Welfare Benefit Credited",
                "Old Age Pension benefit amount of ₹2,500 was credited directly to your bank account via Direct Benefit Transfer (DBT).",
                "DBT-990812",
                "PAYMENT",
                false,
                "CITIZEN",
                LocalDateTime.now().minusMinutes(10)
            ),

            // ── OFFICER NOTIFICATIONS ──────────────────────────────────────────
            new Notification(
                "healthofficer.org",
                "APPLICATION_SUBMITTED",
                "Application Submitted",
                "New Health & Sanitation certificate application (APP-2026-0005) submitted by citizen for verification.",
                "APP-2026-0005",
                "CERTIFICATE",
                false,
                "OFFICER",
                LocalDateTime.now().minusHours(4)
            ),
            new Notification(
                "socialwelfareofficer.org",
                "APPLICATION_SUBMITTED",
                "Application Submitted",
                "Old Age Pension scheme application (APP-2026-0006) submitted by citizen1 Citizen.",
                "APP-2026-0006",
                "WELFARE",
                false,
                "OFFICER",
                LocalDateTime.now().minusHours(2)
            ),
            new Notification(
                "socialwelfareofficer.org",
                "OFFICER_APPROVED",
                "Approved by Officer",
                "You successfully verified and recommended Old Age Pension application for financial sanction.",
                "APP-2026-0006",
                "WELFARE",
                false,
                "OFFICER",
                LocalDateTime.now().minusHours(1)
            ),

            // ── ADMIN NOTIFICATIONS ───────────────────────────────────────────
            new Notification(
                "admin_user",
                "APPLICATION_SUBMITTED",
                "Application Submitted",
                "System Registry: Application APP-2026-0001 submitted by citizen1@gmail.com.",
                "APP-2026-0001",
                "CERTIFICATE",
                false,
                "ADMIN",
                LocalDateTime.now().minusHours(6)
            ),
            new Notification(
                "admin_user",
                "OFFICER_APPROVED",
                "Approved by Officer",
                "Department Officer recommended Income Certificate APP-2026-0001 for executive approval.",
                "APP-2026-0001",
                "CERTIFICATE",
                false,
                "ADMIN",
                LocalDateTime.now().minusHours(3)
            ),
            new Notification(
                "admin_user",
                "ADMIN_APPROVED",
                "Approved by Admin",
                "Administrative sanction granted for APP-2026-0001. Digital certificate generated.",
                "CERT-2026-0001",
                "CERTIFICATE",
                false,
                "ADMIN",
                LocalDateTime.now().minusHours(1)
            ),
            new Notification(
                "admin_user",
                "REPORT_DOWNLOADED",
                "Downloaded Your Report",
                "Administrator downloaded official Executive AI Governance Analytics Report.",
                "REPORT-2026",
                "REPORT",
                false,
                "ADMIN",
                LocalDateTime.now().minusMinutes(15)
            )
        );

        notificationRepository.saveAll(initialNotifs);
        System.out.println("Successfully seeded " + initialNotifs.size() + " lifecycle notifications.");
    }
}
