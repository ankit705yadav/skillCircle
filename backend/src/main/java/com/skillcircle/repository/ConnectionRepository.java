package com.skillcircle.repository;

import com.skillcircle.Entity.Connection;
import com.skillcircle.Entity.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    // Find all pending requests waiting for a specific user's approval
    List<Connection> findByApprover_ClerkUserIdAndStatus(String clerkUserId, ConnectionStatus status);

    // Used for security checks before updating a connection
    Optional<Connection> findByIdAndApprover_ClerkUserId(Long id, String clerkUserId);
}