package org.core.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class YandexAiStudioConfig {

    @Bean
    public OpenAIClient yandexAiStudioClient(
            @Value("${yandex.gpt.api.key}") String apiKey,
            @Value("${yandex.gpt.api.folder-id}") String folderId,
            @Value("${yandex.gpt.api.ai-studio.url}") String baseUrl,
            @Value("${http.client.llm.read-timeout-ms}") long llmReadTimeoutMs
    ) {
        return OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .organization(folderId)
                .timeout(Duration.ofMillis(llmReadTimeoutMs))
                .build();
    }
}
