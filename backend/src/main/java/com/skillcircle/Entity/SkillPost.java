package com.skillcircle.Entity;

import jakarta.persistence.*;

enum PostType { OFFER, ASK }

@Entity
public class SkillPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Use Lazy fetching for performance
    @JoinColumn(name = "author_clerk_user_id", referencedColumnName = "clerkUserId")
    private UserAccount author;

    @Enumerated(EnumType.STRING)
    private PostType type;

    private String title;
    private String description;

    // Constructors, Getters & Setters...
}
