package org.core.config;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class YandexAiStudioConfig {

    @Bean
    public OpenAIClient yandexAiStudioClient(
            @Value("${yandex.gpt.api.key}") String apiKey,
            @Value("${yandex.gpt.api.folder-id}") String folderId,
            @Value("${yandex.gpt.api.ai-studio.url}") String baseUrl
    ) {
        return OpenAIOkHttpClient.builder()
                .apiKey(apiKey)
                .baseUrl(baseUrl)
                .organization(folderId)
                .build();
    }
}
