package com.skillcircle.dto;

// Using a Java Record for a concise, immutable DTO
public record UpdateLocationRequest(double latitude, double longitude) {
}