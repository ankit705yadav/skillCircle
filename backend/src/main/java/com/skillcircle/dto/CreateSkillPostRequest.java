package com.skillcircle.dto;

import com.skillcircle.Entity.PostType;

// A Java Record is a concise way to create an immutable DTO
public record CreateSkillPostRequest(
        String title,
        String description,
        PostType type // Either OFFER or ASK
) {}