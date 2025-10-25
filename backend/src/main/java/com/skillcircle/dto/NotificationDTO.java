package com.skillcircle.dto;

import java.time.LocalDateTime;

public class NotificationDTO {
    private String type; // CONNECTION_REQUEST, CONNECTION_ACCEPTED, NEW_MESSAGE
    private Long entityId; // Connection ID or Message ID
    private String message;
    private LocalDateTime timestamp;
    private Object data; // Additional data (ConnectionResponseDTO or MessageResponseDTO)

    public NotificationDTO() {}

    public NotificationDTO(String type, Long entityId, String message, Object data) {
        this.type = type;
        this.entityId = entityId;
        this.message = message;
        this.timestamp = LocalDateTime.now();
        this.data = data;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
