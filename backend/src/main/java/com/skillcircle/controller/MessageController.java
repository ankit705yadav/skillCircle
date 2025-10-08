package com.skillcircle.controller;

import com.skillcircle.Entity.Message;
import com.skillcircle.dto.AuthorResponse;
import com.skillcircle.dto.SendMessageRequest;
import com.skillcircle.dto.MessageResponseDTO;
import com.skillcircle.repository.MessageRepository;
import com.skillcircle.service.MessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/connections/{connectionId}/messages")
public class MessageController {

    private final MessageService messageService; // Inject the service
    private final MessageRepository messageRepository; // Still needed for GET for now

    public MessageController(MessageService messageService, MessageRepository messageRepository){
        this.messageService = messageService;
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public ResponseEntity<?> getMessages(@PathVariable Long connectionId, @AuthenticationPrincipal Jwt jwt) {
        try {
            String clerkUserId = jwt.getSubject();
            List<Message> messages = messageService.getMessages(connectionId, clerkUserId);

            // Map entities to DTOs before sending
            List<MessageResponseDTO> response = messages.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<MessageResponseDTO> sendMessage(
            @PathVariable Long connectionId,
            @RequestBody SendMessageRequest request, // Use the DTO
            @AuthenticationPrincipal Jwt jwt) {

        String senderClerkId = jwt.getSubject();

        // Delegate all logic and security checks to the service
        Message savedMessage = messageService.sendMessage(
                connectionId,
                senderClerkId,
                request.content()
        );

        // Convert to DTO to avoid serialization issues with lazy-loaded entities
        MessageResponseDTO response = convertToDto(savedMessage);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Helper method to convert a Message entity to its DTO representation.
    private MessageResponseDTO convertToDto(Message message) {
        AuthorResponse senderDto = new AuthorResponse(
                message.getSender().getClerkUserId(),
                message.getSender().getGeneratedUsername()
        );
        return new MessageResponseDTO(
                message.getId(),
                message.getContent(),
                message.getTimestamp(),
                senderDto
        );
    }
}