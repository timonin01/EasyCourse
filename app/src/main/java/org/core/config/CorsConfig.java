package org.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origin-pattern:http://localhost:*}")
    private String allowedOriginPattern;

    @Value("${cors.allowed-origins:}")
    private String allowedOrigins;

    @Value("${cors.allow-credentials:false}")
    private boolean allowCredentials;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        var mapping = registry.addMapping("/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
                if (allowCredentials && !allowedOrigins.isEmpty()) {
            String[] origins = allowedOrigins.split(",");
            mapping.allowedOrigins(origins).allowCredentials(true);
        } else {
            mapping.allowedOriginPatterns(allowedOriginPattern);
        }
    }
}