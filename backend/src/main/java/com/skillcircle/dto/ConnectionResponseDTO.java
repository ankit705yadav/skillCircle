package com.skillcircle.dto;

public record ConnectionResponseDTO(
        Long id,
        String status,
        SkillPostResponse skillPost,
        AuthorResponse requester,
        AuthorResponse approver
) {}