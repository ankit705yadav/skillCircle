package com.skillcircle.service;

import com.skillcircle.dto.ConnectionResponseDTO;
import com.skillcircle.dto.MessageResponseDTO;
import com.skillcircle.dto.NotificationDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send connection request notification to the approver (post author)
     */
    public void notifyConnectionRequest(String approverClerkId, ConnectionResponseDTO connection) {
        NotificationDTO notification = new NotificationDTO(
            "CONNECTION_REQUEST",
            connection.id(),
            "New connection request from " + connection.requester().username(),
            connection
        );

        System.out.println("=== SENDING CONNECTION REQUEST NOTIFICATION ===");
        System.out.println("To User: " + approverClerkId);
        System.out.println("Destination: /user/" + approverClerkId + "/queue/notifications");
        System.out.println("Message: " + notification.getMessage());
        System.out.println("===============================================");

        // Send to specific user's queue
        messagingTemplate.convertAndSendToUser(
            approverClerkId,
            "/queue/notifications",
            notification
        );
    }

    /**
     * Send connection accepted notification to the requester
     */
    public void notifyConnectionAccepted(String requesterClerkId, ConnectionResponseDTO connection) {
        NotificationDTO notification = new NotificationDTO(
            "CONNECTION_ACCEPTED",
            connection.id(),
            connection.approver().username() + " accepted your connection request",
            connection
        );

        System.out.println("=== SENDING CONNECTION ACCEPTED NOTIFICATION ===");
        System.out.println("To User: " + requesterClerkId);
        System.out.println("Message: " + notification.getMessage());
        System.out.println("================================================");

        messagingTemplate.convertAndSendToUser(
            requesterClerkId,
            "/queue/notifications",
            notification
        );
    }

    /**
     * Send new message notification to the recipient
     */
    public void notifyNewMessage(String recipientClerkId, Long connectionId, MessageResponseDTO message) {
        NotificationDTO notification = new NotificationDTO(
            "NEW_MESSAGE",
            message.id(),
            "New message from " + message.sender().username(),
            message
        );

        System.out.println("=== SENDING NEW MESSAGE NOTIFICATION ===");
        System.out.println("To User: " + recipientClerkId);
        System.out.println("Connection ID: " + connectionId);
        System.out.println("Message: " + notification.getMessage());
        System.out.println("========================================");

        // Send to specific user's queue
        messagingTemplate.convertAndSendToUser(
            recipientClerkId,
            "/queue/notifications",
            notification
        );

        // Also send to connection-specific topic for real-time chat updates
        messagingTemplate.convertAndSend(
            "/topic/connection/" + connectionId,
            message
        );
    }

    /**
     * Broadcast connection status change to both parties
     */
    public void notifyConnectionStatusChange(String requesterClerkId, String approverClerkId, ConnectionResponseDTO connection) {
        NotificationDTO notificationForRequester = new NotificationDTO(
            "CONNECTION_STATUS_CHANGED",
            connection.id(),
            "Connection status updated",
            connection
        );

        NotificationDTO notificationForApprover = new NotificationDTO(
            "CONNECTION_STATUS_CHANGED",
            connection.id(),
            "Connection status updated",
            connection
        );

        System.out.println("=== SENDING CONNECTION STATUS CHANGE ===");
        System.out.println("To Requester: " + requesterClerkId);
        System.out.println("To Approver: " + approverClerkId);
        System.out.println("========================================");

        messagingTemplate.convertAndSendToUser(
            requesterClerkId,
            "/queue/notifications",
            notificationForRequester
        );

        messagingTemplate.convertAndSendToUser(
            approverClerkId,
            "/queue/notifications",
            notificationForApprover
        );
    }
}
