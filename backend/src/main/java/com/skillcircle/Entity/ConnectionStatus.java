package com.skillcircle.Entity;

public enum ConnectionStatus {
    PENDING,  // The initial state when a request is made
    ACCEPTED, // The owner of the post accepts the request
    REJECTED, // The owner of the post rejects the request
    COMPLETED // The skill share is finished
}