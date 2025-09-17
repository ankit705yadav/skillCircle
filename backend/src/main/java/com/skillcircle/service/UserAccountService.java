package com.skillcircle.service;

import com.skillcircle.Entity.UserAccount;
import com.skillcircle.repository.UserAccountRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillcircle.component.UsernameGenerator;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final UsernameGenerator usernameGenerator;

    // Regex to validate the username format (e.g., starts with capital, ends with 2 digits)
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[A-Z][a-zA-Z]+[0-9]{2}$");

    public UserAccountService(UserAccountRepository userAccountRepository, UsernameGenerator usernameGenerator) {
        this.userAccountRepository = userAccountRepository;
        this.usernameGenerator = usernameGenerator;
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

    public UserAccount findOrCreateUser(String clerkUserId) {
        // Find the user by their Clerk ID. If they don't exist, create a new entry.
        return userAccountRepository.findByClerkUserId(clerkUserId)
                .orElseGet(() -> {
                    UserAccount newUser = new UserAccount();
                    newUser.setClerkUserId(clerkUserId);
                    // The username is intentionally left null here until the user claims one.
                    return userAccountRepository.save(newUser);
                });
    }

    // Generates a list of unique, available usernames.
    public List<String> generateUsernames() {
        // 1. Get all usernames that are already taken
        Set<String> existingUsernames = userAccountRepository.findAllClaimedUsernames();
        // 2. Generate a list of names that don't conflict
        return usernameGenerator.generateUniqueUsernameList(5, existingUsernames);
    }

    // Claims a username for a user.
    @Transactional
    public void claimUsername(String clerkUserId, String usernameToClaim) {
        // Validation 1: Find the user
        UserAccount user = userAccountRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new IllegalStateException("User with Clerk ID " + clerkUserId + " not found."));

        // Validation 2: Check if user already has a username
        if (user.getGeneratedUsername() != null && !user.getGeneratedUsername().isEmpty()) {
            throw new IllegalStateException("User has already claimed a username.");
        }

        // Validation 3: Check the format of the submitted username {validation not really required as usernames are generated on server-side with validations}
        if (usernameToClaim == null || !USERNAME_PATTERN.matcher(usernameToClaim).matches()) {
            throw new IllegalArgumentException("Username format is invalid.");
        }

        // Validation 5: Final uniqueness check (to prevent race conditions)
        if (userAccountRepository.existsByGeneratedUsername(usernameToClaim)) {
            throw new IllegalStateException("Username '" + usernameToClaim + "' has just been taken.");
        }

        // All checks passed! Save the username.
        user.setGeneratedUsername(usernameToClaim);
        userAccountRepository.save(user);
    }

}
