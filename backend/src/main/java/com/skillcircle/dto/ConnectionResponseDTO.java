package com.skillcircle.dto;

import java.time.LocalDateTime;

public record ConnectionResponseDTO(
        Long id,
        String status,
        SkillPostResponse skillPost,
        AuthorResponse requester,
        AuthorResponse approver,
        LocalDateTime createdAt,
        LocalDateTime acceptedAt
) {}
