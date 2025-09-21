package com.skillcircle.controller;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.dto.AuthorResponse;
import com.skillcircle.dto.CreateSkillPostRequest;
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

    private final SkillPostService skillPostService;
    private final SkillPostRepository skillPostRepository;

    public SkillPostController(SkillPostService skillPostService, SkillPostRepository skillPostRepository) {
        this.skillPostService = skillPostService;
        this.skillPostRepository = skillPostRepository;
    }

    @GetMapping("/nearby")
    public List<SkillPostResponse> getNearbySkills(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "1000000") int radius) {

        List<SkillPost> skillPosts = skillPostRepository.findPostsNearby(lat, lon, radius);

        return skillPosts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> createSkill(
            @RequestBody CreateSkillPostRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String clerkUserId = jwt.getSubject();
            SkillPost createdPost = skillPostService.createSkillPost(request, clerkUserId);
            return new ResponseEntity<>(convertToDto(createdPost), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = Map.of("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    private SkillPostResponse convertToDto(SkillPost post) {
        // 1. Create the nested AuthorResponse object first.
        AuthorResponse authorDto = new AuthorResponse(
                post.getAuthor().getClerkUserId(),
                post.getAuthor().getGeneratedUsername()
        );


        return new SkillPostResponse(
                post.getId(),
                post.getTitle(),
                post.getDescription(),
                post.getType().name(),
                authorDto,
                post.getPosterImageUrl(),
                post.isArchived()
        );
    }

    /**
     * Gets all skill posts for the currently authenticated user.
     */
    @GetMapping("/my-skills")
    public List<SkillPostResponse> getMySkills(@AuthenticationPrincipal Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        List<SkillPost> skillPosts = skillPostRepository.findAllByAuthor_ClerkUserId(clerkUserId);

        return skillPosts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @PostMapping("/{skillPostId}/archive")
    public ResponseEntity<?> archiveSkill(
            @PathVariable Long skillPostId,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String clerkUserId = jwt.getSubject();
            skillPostService.archiveSkillPost(skillPostId, clerkUserId);
            return ResponseEntity.ok().body(Map.of("message", "Post archived successfully."));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } // ... other exception handling
    }
}