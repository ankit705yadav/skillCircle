package com.skillcircle.dto;

// This record defines the structure for a connection/notification sent to the frontend.
public record ConnectionResponseDTO(
        Long id,
        String status,
        SkillPostResponse skillPost, // The full details of the post
        AuthorResponse requester    // The profile of the user who sent the request
) {}