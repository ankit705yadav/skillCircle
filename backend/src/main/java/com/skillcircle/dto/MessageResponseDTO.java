package com.skillcircle.dto;

import java.time.LocalDateTime;

// This record defines the structure for a single message sent to the frontend.
public record MessageResponseDTO(
        Long id,
        String content,
        LocalDateTime timestamp,
        AuthorResponse sender // Reusing the AuthorResponse DTO for sender info
) {}