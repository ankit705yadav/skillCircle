package com.skillcircle.controller;

import io.imagekit.sdk.ImageKit;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/imagekit")
public class ImageKitAuthController {

    private final ImageKit imageKit;

    public ImageKitAuthController(ImageKit imageKit) {
        this.imageKit = imageKit;
    }

    @GetMapping("/auth")
    public ResponseEntity<Map<String, String>> getAuthParameters() {
        // Manually generate a valid expiration timestamp
        // 1. Get the current time in SECONDS (Unix time). System.currentTimeMillis() is in milliseconds.
        long nowInSeconds = System.currentTimeMillis() / 1000L;

        // 2. Set an expiration for 15 minutes (900 seconds) from now.
        long expiryTimestamp = nowInSeconds + (15 * 60);

        // 3. Call the SDK with the manually created timestamp.
        // Passing 'null' for the token tells the SDK to generate one.
        Map<String, String> authParams = imageKit.getAuthenticationParameters(null, expiryTimestamp);

        return ResponseEntity.ok(authParams);
    }
}