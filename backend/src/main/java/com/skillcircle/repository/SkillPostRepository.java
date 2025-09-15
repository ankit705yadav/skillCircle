package com.skillcircle.repository;

import com.skillcircle.Entity.SkillPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SkillPostRepository extends JpaRepository<SkillPost, Long> {

    @Query(value = "SELECT p.* FROM skill_post p JOIN user_account u ON p.author_clerk_user_id = u.clerk_user_id WHERE ST_DWithin(u.location, ST_MakePoint(:lon, :lat), :distance, true)", nativeQuery = true)
    List<SkillPost> findPostsNearby(
            @Param("lat") double latitude,
            @Param("lon") double longitude,
            @Param("distance") int distanceInMeters
    );
}