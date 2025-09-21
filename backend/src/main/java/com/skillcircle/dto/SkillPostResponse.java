package com.skillcircle.dto;

public record SkillPostResponse(
        Long id,
        String title,
        String description,
        String type,
        AuthorResponse author,
        String posterImageUrl,
         boolean archived
) {}