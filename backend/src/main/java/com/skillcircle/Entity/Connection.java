package com.skillcircle.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Connection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "skill_post_id")
    private SkillPost skillPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private UserAccount requester; // The user who initiates the connection

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private UserAccount approver; // The user who owns the post and must approve

    @Enumerated(EnumType.STRING)
    private ConnectionStatus status;

    private LocalDateTime createdAt;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public SkillPost getSkillPost() {
        return skillPost;
    }

    public void setSkillPost(SkillPost skillPost) {
        this.skillPost = skillPost;
    }

    public UserAccount getRequester() {
        return requester;
    }

    public void setRequester(UserAccount requester) {
        this.requester = requester;
    }

    public UserAccount getApprover() {
        return approver;
    }

    public void setApprover(UserAccount approver) {
        this.approver = approver;
    }

    public ConnectionStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectionStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
