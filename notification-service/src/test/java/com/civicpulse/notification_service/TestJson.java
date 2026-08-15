package com.civicpulse.notification_service;

import com.civicpulse.notification_service.entity.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;

public class TestJson {
    public static void main(String[] args) throws Exception {
        Notification n = new Notification();
        n.setRecipient("bd5b60cb-9c09-4574-97a3-ad0142a10588");
        n.setEventType("COMPLAINT_SUBMITTED");
        n.setTitle("Test Title");
        n.setMessage("Test Msg");
        n.setRelatedEntityId("123");
        n.setRelatedEntityType("COMPLAINT");
        n.setReadStatus(false);
        n.setRecipientRole("CITIZEN");
        n.setCreatedAt(LocalDateTime.now());

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        
        System.out.println(mapper.writeValueAsString(n));
    }
}
