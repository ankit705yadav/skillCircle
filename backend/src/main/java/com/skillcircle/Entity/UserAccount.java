package com.skillcircle.Entity;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;

@Entity
public class UserAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String clerkUserId;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    private String generatedUsername;

    // --- GETTERS AND SETTERS ---
    // These methods were missing

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClerkUserId() {
        return clerkUserId;
    }

    public void setClerkUserId(String clerkUserId) {
        this.clerkUserId = clerkUserId;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public void setGeneratedUsername(String generatedUsername) {
        this.generatedUsername = generatedUsername;
    }

    public String getGeneratedUsername() {
        return generatedUsername;
    }


}