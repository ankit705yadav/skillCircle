package com.skillcircle.dto;

public record StatsResponseDTO(
        long totalUsers,
        long totalConnections,
        long activeConnections,
        long totalPosts,
        long activePosts
) {}