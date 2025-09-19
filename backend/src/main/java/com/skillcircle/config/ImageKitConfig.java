package com.skillcircle.config;

import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.config.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class ImageKitConfig {

    @Value("${imagekit.public.key}")
    private String publicKey;

    @Value("${imagekit.private.key}")
    private String privateKey;

    @Value("${imagekit.url.endpoint}")
    private String urlEndpoint;

    @Bean
    public ImageKit imageKit() {
        // 1. Get the singleton instance first
        ImageKit imageKit = ImageKit.getInstance();

        // 2. Create the configuration object
        Configuration config = new Configuration(publicKey, privateKey, urlEndpoint);

        // 3. Configure the instance (this is a void method)
        imageKit.setConfig(config);

        // 4. Return the now-configured instance
        return imageKit;
    }
}