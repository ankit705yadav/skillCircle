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

    // We'll add generatedUsername and other fields later

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point location;

    // Constructors, Getters & Setters...
}