package com.skillcircle.controller;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.dto.CreateSkillPostRequest;
import com.skillcircle.dto.AuthorResponse;
import com.skillcircle.dto.SkillPostResponse;
import com.skillcircle.repository.SkillPostRepository;
import com.skillcircle.service.SkillPostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/skills")
public class SkillPostController {

    // Inject the Service instead of the Repository directly
    private final SkillPostService skillPostService;
    private final SkillPostRepository skillPostRepository; // Still needed for the GET method

    public SkillPostController(SkillPostService skillPostService, SkillPostRepository skillPostRepository) {
        this.skillPostService = skillPostService;
        this.skillPostRepository = skillPostRepository;
    }

    @GetMapping("/nearby")
    public List<SkillPostResponse> getNearbySkills(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1000000") int radius) {  // 10km default

        List<SkillPost> skillPosts = skillPostRepository.findPostsNearby(lat, lon, radius);

        return skillPosts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Creates a new Skill Post (Offer or Ask).
//    @PostMapping
//    public ResponseEntity<SkillPost> createSkill(
//            @RequestBody CreateSkillPostRequest request,
//            @AuthenticationPrincipal Jwt jwt) {
//
//        // Get the authenticated user's ID from the JWT token
//        String clerkUserId = jwt.getSubject();
//
//        // Delegate the creation logic to the service
//        SkillPost createdPost = skillPostService.createSkillPost(request, clerkUserId);
//
//        // Return a 201 Created status with the new post in the body
//        return new ResponseEntity<>(createdPost, HttpStatus.CREATED);
//    }
    @PostMapping
    public ResponseEntity<?> createSkill( // Changed the return type to ResponseEntity<?>
                                          @RequestBody CreateSkillPostRequest request,
                                          @AuthenticationPrincipal Jwt jwt) {
        try {
            String clerkUserId = jwt.getSubject();

            // Delegate the creation logic to the service
            SkillPost createdPost = skillPostService.createSkillPost(request, clerkUserId);

            // Return a 201 Created status with the new post in the body
            return new ResponseEntity<>(createdPost, HttpStatus.CREATED);

            // ✅ CATCH THE EXCEPTION FROM THE MODERATION SERVICE
        } catch (IllegalArgumentException e) {
            // Create a simple map to hold the error message
            Map<String, String> errorResponse = Map.of("error", e.getMessage());
            // Return a 400 Bad Request status with the error message in the body
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private SkillPostResponse convertToDto(SkillPost post) {
        AuthorResponse authorDto = new AuthorResponse(
                post.getAuthor().getClerkUserId(),
                post.getAuthor().getGeneratedUsername()
        );

        return new SkillPostResponse(
                post.getId(),
                post.getTitle(),
                post.getDescription(),
                post.getType().name(),
                authorDto
        );
    }
}