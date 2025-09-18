package com.skillcircle.service;

import com.skillcircle.Entity.Connection;
import com.skillcircle.Entity.ConnectionStatus;
import com.skillcircle.Entity.Message;
import com.skillcircle.Entity.UserAccount;
import com.skillcircle.repository.ConnectionRepository;
import com.skillcircle.repository.MessageRepository;
import com.skillcircle.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConnectionRepository connectionRepository;
    private final UserAccountRepository userAccountRepository;

    public MessageService(MessageRepository messageRepository, ConnectionRepository connectionRepository, UserAccountRepository userAccountRepository) {
        this.messageRepository = messageRepository;
        this.connectionRepository = connectionRepository;
        this.userAccountRepository = userAccountRepository;
    }

    public List<Message> getMessages(Long connectionId, String currentClerkId) {
        // 1. Find the connection
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found."));

        // 2. SECURITY CHECK: Verify the current user is part of this conversation
        String requesterId = connection.getRequester().getClerkUserId();
        String approverId = connection.getApprover().getClerkUserId();

        if (!currentClerkId.equals(requesterId) && !currentClerkId.equals(approverId)) {
            throw new SecurityException("User is not authorized to view these messages.");
        }

        // 3. If authorized, fetch and return the messages
        return messageRepository.findByConnectionIdOrderByTimestampAsc(connectionId);
    }

    @Transactional
    public Message sendMessage(Long connectionId, String senderClerkId, String content) {
        // Validation 1: Find the connection, sender, and make sure they exist.
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found."));
        UserAccount sender = userAccountRepository.findByClerkUserId(senderClerkId)
                .orElseThrow(() -> new IllegalStateException("Sender not found."));

        // SECURITY CHECK 1: Ensure the connection has been accepted.
        if (connection.getStatus() != ConnectionStatus.ACCEPTED) {
            throw new IllegalStateException("Messages can only be sent in accepted connections.");
        }

        // SECURITY CHECK 2: Ensure the sender is actually part of this connection.
        boolean isParticipant = connection.getRequester().equals(sender) || connection.getApprover().equals(sender);
        if (!isParticipant) {
            throw new SecurityException("User is not a participant in this connection.");
        }

        // All checks passed, create and save the message.
        Message message = new Message();
        message.setConnection(connection);
        message.setSender(sender);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());

        return messageRepository.save(message);
    }
}