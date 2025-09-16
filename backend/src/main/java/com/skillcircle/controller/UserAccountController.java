package com.skillcircle.controller;

import com.skillcircle.dto.UpdateLocationRequest;
import com.skillcircle.service.UserAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserAccountController {

    private final UserAccountService userAccountService;

    public UserAccountController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> syncUser(
            @RequestBody UpdateLocationRequest locationRequest,
            @AuthenticationPrincipal Jwt jwt) { // Injects the validated JWT

        // The 'sub' (subject) claim in a Clerk JWT is the user's ID
        String clerkUserId = jwt.getSubject();

        userAccountService.syncUserLocation(
                clerkUserId,
                locationRequest.latitude(),
                locationRequest.longitude()
        );

        return ResponseEntity.ok().build();
    }
}