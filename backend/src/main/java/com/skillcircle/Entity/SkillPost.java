package com.skillcircle.Entity;

import jakarta.persistence.*;

@Entity
public class SkillPost {

    // --- CONSTRUCTORS ---
    // Default constructor needed by JPA
    public SkillPost() {
    }

    // Parameterized constructor for easier instantiation
    public SkillPost(UserAccount author, PostType type, String title, String description) {
        this.author = author;
        this.type = type;
        this.title = title;
        this.description = description;
    }

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

    @Column(nullable = true)
    private String posterImageUrl;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean archived = false;



    // --- GETTERS AND SETTERS ---
    public Long getId() {
        return id;
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

    public String getPosterImageUrl() {
        return posterImageUrl;
    }

    public void setPosterImageUrl(String posterImageUrl) {
        this.posterImageUrl = posterImageUrl;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}