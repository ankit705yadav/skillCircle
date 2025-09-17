package com.skillcircle.dto;

// This record defines the user data sent to the frontend.
public record UserAccountResponse(
        String clerkUserId,
        String generatedUsername
) {}