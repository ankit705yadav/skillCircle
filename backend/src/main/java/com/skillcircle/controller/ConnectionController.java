package com.skillcircle.controller;

import com.skillcircle.Entity.Connection;
import com.skillcircle.service.ConnectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService){
        this.connectionService = connectionService;
    }

    @PostMapping
    public ResponseEntity<Connection> createConnection(@RequestBody Map<String, Long> payload, @AuthenticationPrincipal Jwt jwt) {
        Long skillPostId = payload.get("skillPostId");
        String requesterClerkId = jwt.getSubject();
        Connection newConnection = connectionService.createConnectionRequest(skillPostId, requesterClerkId);
        return new ResponseEntity<>(newConnection, HttpStatus.CREATED);
    }
    

    // Endpoint to get pending notifications for the logged-in user
    @GetMapping("/notifications")
    public ResponseEntity<List<Connection>> getNotifications(@AuthenticationPrincipal Jwt jwt) {
        String approverClerkId = jwt.getSubject();
        List<Connection> notifications = connectionService.getPendingNotifications(approverClerkId);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{connectionId}/accept")
    public ResponseEntity<Connection> acceptConnection(@PathVariable Long connectionId, @AuthenticationPrincipal Jwt jwt) {
        String approverClerkId = jwt.getSubject();
        Connection acceptedConnection = connectionService.acceptConnection(connectionId, approverClerkId);
        return ResponseEntity.ok(acceptedConnection);
    }

    // Endpoint to reject a connection
    @PostMapping("/{connectionId}/reject")
    public ResponseEntity<Connection> rejectConnection(@PathVariable Long connectionId, @AuthenticationPrincipal Jwt jwt) {
        String approverClerkId = jwt.getSubject();
        Connection rejectedConnection = connectionService.rejectConnection(connectionId, approverClerkId);
        return ResponseEntity.ok(rejectedConnection);
    }
}