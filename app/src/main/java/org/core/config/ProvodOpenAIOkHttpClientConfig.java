package org.core.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class ProvodOpenAIOkHttpClientConfig {

    @Bean
    public OpenAIClient provodAiClient(
            @Value("${provod.api.key}") String apiKey,
            @Value("${provod.url}") String baseUrl,
            @Value("${http.client.llm.read-timeout-ms}") long llmReadTimeoutMs
    ) {
        return OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .timeout(Duration.ofMillis(llmReadTimeoutMs))
                .build();
    }
}
