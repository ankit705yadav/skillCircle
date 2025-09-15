package com.skillcircle.controller;

import com.skillcircle.Entity.SkillPost;
import com.skillcircle.repository.SkillPostRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillPostController {

    private final SkillPostRepository skillPostRepository;

    public SkillPostController(SkillPostRepository skillPostRepository) {
        this.skillPostRepository = skillPostRepository;
    }

    @GetMapping("/nearby")
    public List<SkillPost> getNearbySkills(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "10000") int radius) {
        return skillPostRepository.findPostsNearby(lat, lon, radius);
    }

    // We'll add a POST method for creating skills later.
}
