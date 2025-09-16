package com.skillcircle.service;

import com.skillcircle.Entity.UserAccount;
import com.skillcircle.repository.UserAccountRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory();

    public UserAccountService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public void syncUserLocation(String clerkUserId, double latitude, double longitude) {
        // Find user by Clerk ID, or create a new one if they don't exist
        UserAccount user = userAccountRepository.findByClerkUserId(clerkUserId)
                .orElseGet(() -> {
                    UserAccount newUser = new UserAccount();
                    newUser.setClerkUserId(clerkUserId);
                    // You can add logic here to generate an anonymous username
                    return newUser;
                });

        // Create a geographic Point from the coordinates
        Point location = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        location.setSRID(4326); // Set standard GPS coordinate system

        user.setLocation(location);
        userAccountRepository.save(user);
    }
}
