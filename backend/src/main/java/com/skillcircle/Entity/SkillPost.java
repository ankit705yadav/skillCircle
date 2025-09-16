package com.skillcircle.Entity;

import jakarta.persistence.*;

@Entity
public class SkillPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_clerk_user_id", referencedColumnName = "clerkUserId")
    private UserAccount author;

    @Enumerated(EnumType.STRING)
    private PostType type;

    private String title;
    private String description;

    // --- CONSTRUCTORS ---

    /**
     * No-argument constructor required by JPA.
     */
    public SkillPost() {
    }

    /**
     * Convenience constructor to create a new post with initial values.
     */
    public SkillPost(UserAccount author, PostType type, String title, String description) {
        this.author = author;
        this.type = type;
        this.title = title;
        this.description = description;
    }


    // --- GETTERS AND SETTERS ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserAccount getAuthor() {
        return author;
    }

    public void setAuthor(UserAccount author) {
        this.author = author;
    }

    public PostType getType() {
        return type;
    }

    public void setType(PostType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}