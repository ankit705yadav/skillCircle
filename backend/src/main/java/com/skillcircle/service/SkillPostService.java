package com.skillcircle.service;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.Entity.UserAccount;
import com.skillcircle.dto.CreateSkillPostRequest;
import com.skillcircle.repository.SkillPostRepository;
import com.skillcircle.repository.UserAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SkillPostService {

    private final SkillPostRepository skillPostRepository;
    private final UserAccountRepository userAccountRepository;

    public SkillPostService(SkillPostRepository skillPostRepository, UserAccountRepository userAccountRepository) {
        this.skillPostRepository = skillPostRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public SkillPost createSkillPost(CreateSkillPostRequest request, String clerkUserId) {
        // Here is where you would call an AI moderation service on request.title() and request.description()
        // For now, we'll proceed directly.

        // 1. Find the author of the post from the database
        UserAccount author = userAccountRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new IllegalStateException("User not found for Clerk ID: " + clerkUserId));

        // 2. Create a new SkillPost entity
        SkillPost newSkillPost = new SkillPost();
        newSkillPost.setTitle(request.title());
        newSkillPost.setDescription(request.description());
        newSkillPost.setType(request.type());
        newSkillPost.setAuthor(author);

        // 3. Save the new entity to the database and return it
        return skillPostRepository.save(newSkillPost);
    }
}