package com.skillcircle.component;

import org.springframework.stereotype.Component;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Component
public class UsernameGenerator {

    private static final String[] ADJECTIVES = {
            "Agile", "Bright", "Clever", "Daring", "Eager", "Fearless",
            "Gentle", "Happy", "Jolly", "Keen", "Lucky", "Mighty"
    };

    private static final String[] NOUNS = {
            "Panda", "Fox", "Lion", "Tiger", "Eagle", "Shark",
            "Wolf", "Bear", "Hawk", "Koala", "Jaguar", "Leopard"
    };
    private final Random random = new Random();

    public String generateUsername() {
        String adjective = ADJECTIVES[random.nextInt(ADJECTIVES.length)];
        String noun = NOUNS[random.nextInt(NOUNS.length)];
        int number = 10 + random.nextInt(90);
        return adjective + noun + number;
    }

    /**
     * Generates a list of usernames that are guaranteed not to be in the provided set of existing names.
     * @param count The number of unique usernames to generate.
     * @param existingUsernames A Set of usernames that are already taken.
     * @return A list of available usernames.
     */
    public List<String> generateUniqueUsernameList(int count, Set<String> existingUsernames) {
        Set<String> generated = new HashSet<>();
        while (generated.size() < count) {
            String newUsername = generateUsername();
            if (!existingUsernames.contains(newUsername)) {
                generated.add(newUsername);
            }
        }
        return generated.stream().collect(Collectors.toList());
    }
}