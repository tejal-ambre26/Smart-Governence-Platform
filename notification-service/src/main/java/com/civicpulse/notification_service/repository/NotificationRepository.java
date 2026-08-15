package com.civicpulse.notification_service.repository;

import com.civicpulse.notification_service.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(String recipient);

    @Query("SELECT n FROM Notification n WHERE LOWER(n.recipient) = LOWER(:recipient) OR LOWER(n.recipient) = LOWER(:username) ORDER BY n.createdAt DESC")
    List<Notification> findForUserOrSub(@Param("recipient") String recipient, @Param("username") String username);

    @Query("SELECT n FROM Notification n WHERE LOWER(n.recipient) = LOWER(:recipient) OR LOWER(n.recipient) = 'admin' OR LOWER(n.recipientRole) = 'admin' ORDER BY n.createdAt DESC")
    List<Notification> findForAdmin(@Param("recipient") String recipient);
}
