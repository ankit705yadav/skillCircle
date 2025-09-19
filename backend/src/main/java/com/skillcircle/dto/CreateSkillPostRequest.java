package com.skillcircle.dto;

import com.skillcircle.Entity.PostType;

public record CreateSkillPostRequest(
        String title,
        String description,
        PostType type, // Either OFFER or ASK
        String posterImageUrl
) {}