package com.skillcircle.controller;

import com.skillcircle.Entity.Connection;
import com.skillcircle.Entity.SkillPost;
import com.skillcircle.dto.AuthorResponse;
import com.skillcircle.dto.ConnectionResponseDTO;
import com.skillcircle.dto.SkillPostResponse;
import com.skillcircle.service.ConnectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections")
public class ConnectionController {

    private final ConnectionService connectionService;

    public ConnectionController(ConnectionService connectionService){
        this.connectionService = connectionService;
    }

    @PostMapping
    public ResponseEntity<ConnectionResponseDTO> createConnection(@RequestBody Map<String, Long> payload, @AuthenticationPrincipal Jwt jwt) {
    Long skillPostId = payload.get("skillPostId");
    String requesterClerkId = jwt.getSubject();

    // The service still creates and saves the real entity
    Connection newConnection = connectionService.createConnectionRequest(skillPostId, requesterClerkId);

    // We convert the saved entity to a DTO before sending it back
    ConnectionResponseDTO response = convertToDto(newConnection);

    return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    

    // Endpoint to get all connection-requests
    @GetMapping("/notifications")
    public ResponseEntity<List<ConnectionResponseDTO>> getNotifications(@AuthenticationPrincipal Jwt jwt) {
        String approverClerkId = jwt.getSubject();
        List<Connection> notifications = connectionService.getPendingNotifications(approverClerkId);

        // This mapping step is what prevents the error
        List<ConnectionResponseDTO> response = notifications.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // End point to get all active connectins
    @GetMapping("/active")
    public ResponseEntity<List<ConnectionResponseDTO>> getActiveConnections(@AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        List<Connection> connections = connectionService.getActiveConnections(clerkUserId);

        // Map the entities to DTOs for a clean response
        List<ConnectionResponseDTO> response = connections.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Endpoint to accept a connection
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

    // Helper method to convert a Connection entity to its DTO representation.
    private ConnectionResponseDTO convertToDto(Connection connection) {
        SkillPostResponse skillPostDto = convertToDto(connection.getSkillPost());
        AuthorResponse requesterDto = new AuthorResponse(
                connection.getRequester().getClerkUserId(),
                connection.getRequester().getGeneratedUsername()
        );
        AuthorResponse approverDto = new AuthorResponse(
                connection.getApprover().getClerkUserId(),
                connection.getApprover().getGeneratedUsername()
        );

        return new ConnectionResponseDTO(
                connection.getId(),
                connection.getStatus().name(),
                skillPostDto,
                requesterDto,
                approverDto
        );
    }


    // Helper method to convert a SkillPost entity to its DTO.
    private SkillPostResponse convertToDto(SkillPost post) {
        AuthorResponse authorDto = new AuthorResponse(
                post.getAuthor().getClerkUserId(),
                post.getAuthor().getGeneratedUsername()
        );

        return new SkillPostResponse(
                post.getId(),
                post.getTitle(),
                post.getDescription(),
                post.getType().name(),
                authorDto
        );
    }
}