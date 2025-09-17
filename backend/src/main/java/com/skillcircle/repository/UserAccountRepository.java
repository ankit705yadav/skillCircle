package com.skillcircle.repository;

import com.skillcircle.Entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import java.util.Set;

// Extend JpaRepository<EntityType, PrimaryKeyType>
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    // This method signature provides the .orElseGet() functionality
    Optional<UserAccount> findByClerkUserId(String clerkUserId);

    // Method to check if a username already exists
    boolean existsByGeneratedUsername(String username);

    // Method to get all usernames that have been claimed
    @Query("SELECT u.generatedUsername FROM UserAccount u WHERE u.generatedUsername IS NOT NULL")
    Set<String> findAllClaimedUsernames();
}
