package com.skillcircle.repository;

import com.skillcircle.Entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

// Extend JpaRepository<EntityType, PrimaryKeyType>
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    // This method signature provides the .orElseGet() functionality
    Optional<UserAccount> findByClerkUserId(String clerkUserId);
}
