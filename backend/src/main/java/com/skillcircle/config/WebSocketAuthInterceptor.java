package com.skillcircle.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;

    public WebSocketAuthInterceptor(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract the Authorization header
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    String token = authHeader.substring(7);
                    Jwt jwt = jwtDecoder.decode(token);
                    Authentication auth = new JwtAuthenticationToken(jwt);
                    accessor.setUser(auth);
                    System.out.println("✓ WebSocket authenticated successfully for user: " + jwt.getSubject());
                } catch (Exception e) {
                    System.err.println("✗ WebSocket authentication failed: " + e.getMessage());
                    System.err.println("  Client should reconnect with a fresh token");
                    // Allow connection but without authentication
                    // The frontend will automatically reconnect with a fresh token
                }
            } else {
                System.err.println("✗ WebSocket connection attempt without valid Authorization header");
            }
        }

        return message;
    }
}
