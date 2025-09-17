package com.skillcircle.service;
// ... imports for Connection, SkillPost, UserAccount, repositories, etc.

import com.skillcircle.Entity.Connection;
import com.skillcircle.Entity.ConnectionStatus;
import com.skillcircle.Entity.UserAccount;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.repository.ConnectionRepository;
import com.skillcircle.repository.SkillPostRepository;
import com.skillcircle.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConnectionService {
    private final ConnectionRepository connectionRepository;
    private final SkillPostRepository skillPostRepository;
    private final UserAccountRepository userAccountRepository;


    public ConnectionService(ConnectionRepository connectionRepository, SkillPostRepository skillPostRepository, UserAccountRepository userAccountRepository){
        this.connectionRepository = connectionRepository;
        this.skillPostRepository = skillPostRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public Connection createConnectionRequest(Long skillPostId, String requesterClerkId) {
        SkillPost skillPost = skillPostRepository.findById(skillPostId)
                .orElseThrow(() -> new IllegalArgumentException("Skill post not found"));
        UserAccount requester = userAccountRepository.findByClerkUserId(requesterClerkId)
                .orElseThrow(() -> new IllegalStateException("Requester not found"));

        // The approver is the author of the post
        UserAccount approver = skillPost.getAuthor();

        // Prevent users from requesting their own posts
        if (requester.equals(approver)) {
            throw new IllegalStateException("You cannot connect with yourself.");
        }

        Connection newConnection = new Connection();
        newConnection.setSkillPost(skillPost);
        newConnection.setRequester(requester);
        newConnection.setApprover(approver);
        newConnection.setStatus(ConnectionStatus.PENDING);
        newConnection.setCreatedAt(LocalDateTime.now());

        return connectionRepository.save(newConnection);
    }

    @Transactional
    public Connection acceptConnection(Long connectionId, String approverClerkId) {
        Connection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new IllegalArgumentException("Connection not found"));

        // Security check: ensure the user accepting is the designated approver
        if (!connection.getApprover().getClerkUserId().equals(approverClerkId)) {
            throw new IllegalStateException("You are not authorized to accept this request.");
        }

        connection.setStatus(ConnectionStatus.ACCEPTED);
        return connectionRepository.save(connection);
    }

    // Get all PENDING requests for a user
    public List<Connection> getPendingNotifications(String approverClerkId) {
        return connectionRepository.findByApprover_ClerkUserIdAndStatus(approverClerkId, ConnectionStatus.PENDING);
    }

    // Reject a connection
    @Transactional
    public Connection rejectConnection(Long connectionId, String approverClerkId) {
        Connection connection = connectionRepository.findByIdAndApprover_ClerkUserId(connectionId, approverClerkId)
                .orElseThrow(() -> new IllegalStateException("Connection not found or you are not authorized to reject it."));

        connection.setStatus(ConnectionStatus.REJECTED);
        return connectionRepository.save(connection);
    }
}