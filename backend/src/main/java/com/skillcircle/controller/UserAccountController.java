package com.skillcircle.controller;

import com.skillcircle.Entity.UserAccount;
import com.skillcircle.dto.ClaimUsernameRequest;
import com.skillcircle.dto.UpdateLocationRequest;
import com.skillcircle.dto.UserAccountResponse;
import com.skillcircle.service.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserAccountController {

    private final UserAccountService userAccountService;

    public UserAccountController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    // To create account || get clerkID & userName {but i'am already passing clerkID in req-body}
    @GetMapping("/me")
    public ResponseEntity<UserAccountResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        UserAccount user = userAccountService.findOrCreateUser(clerkUserId);
        UserAccountResponse responseDto = new UserAccountResponse(user.getClerkUserId(), user.getGeneratedUsername());
        return ResponseEntity.ok(responseDto);
    }

    // sync user-location
    @PostMapping("/sync")
    public ResponseEntity<Void> syncUser(
            @RequestBody UpdateLocationRequest locationRequest,
            @AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        userAccountService.syncUserLocation(
                clerkUserId,
                locationRequest.latitude(),
                locationRequest.longitude()
        );
        return ResponseEntity.ok().build();
    }

    // Generates a list of unique and available usernames for the user to choose from.
    @GetMapping("/generate-usernames")
    public ResponseEntity<List<String>> generateUsernames() {
        List<String> usernames = userAccountService.generateUsernames();
        return ResponseEntity.ok(usernames);
    }

    @PostMapping("/claim-username")
    public ResponseEntity<?> claimUsername(
            @RequestBody ClaimUsernameRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String clerkUserId = jwt.getSubject();
            userAccountService.claimUsername(clerkUserId, request.username());
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}