package org.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient yookassaRestClient(@Value("${app.yookassa.shopId}") String shopId,
            @Value("${app.yookassa.secretKey}") String secretKey,
            @Value("${http.client.connect-timeout-ms}") int connectTimeoutMs,
            @Value("${http.client.read-timeout-ms}") int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);

        String credentials = Base64.getEncoder()
                .encodeToString((shopId + ":" + secretKey).getBytes(StandardCharsets.UTF_8));

        return RestClient.builder()
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                .build();
    }
}
