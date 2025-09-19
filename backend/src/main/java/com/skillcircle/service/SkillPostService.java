package com.skillcircle.service;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.Entity.UserAccount;
import com.skillcircle.dto.CreateSkillPostRequest;
import com.skillcircle.repository.SkillPostRepository;
import com.skillcircle.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;

@Service
public class SkillPostService {

    private final SkillPostRepository skillPostRepository;
    private final UserAccountRepository userAccountRepository;
    private final ModerationService moderationService;

    public SkillPostService(SkillPostRepository skillPostRepository, UserAccountRepository userAccountRepository,ModerationService moderationService) {
        this.skillPostRepository = skillPostRepository;
        this.userAccountRepository = userAccountRepository;
        this.moderationService = moderationService;
    }

    @Transactional
    public SkillPost createSkillPost(CreateSkillPostRequest request, String clerkUserId) {

        // Content moderation
        try {
            if (moderationService.isContentInappropriate(request.title() + " " + request.description())) {
                throw new IllegalArgumentException("Post contains inappropriate content and was rejected.");
            }
        } catch (IOException e) {
            System.err.println("Could not moderate content. Allowing post for now. Error: " + e.getMessage());
        }


        // 1. Find the author of the post from the database
        UserAccount author = userAccountRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new IllegalStateException("User not found for Clerk ID: " + clerkUserId));

        // 2. Create a new SkillPost entity
        SkillPost newSkillPost = new SkillPost();
        newSkillPost.setTitle(request.title());
        newSkillPost.setDescription(request.description());
        newSkillPost.setPosterImageUrl(request.posterImageUrl());
        newSkillPost.setType(request.type());
        newSkillPost.setAuthor(author);

        // 3. Save the new entity to the database and return it
        return skillPostRepository.save(newSkillPost);
    }
}