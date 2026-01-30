package org.core.service.agent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemPromptService {
    
    private final ResourceLoader resourceLoader;
    private final Map<String, String> promptCache = new ConcurrentHashMap<>();
    
    public String getPromptForQuery(String query) {
        return promptCache.computeIfAbsent(query, type -> {
            try {
                Resource resource = resourceLoader.getResource("classpath:prompts/stepik/" + type + ".txt");
                return resource.getContentAsString(StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new RuntimeException("Prompt not found for type: {}, using default");
            }
        });
    }

    public String getBatchPromptByQuery(String query){
        String cacheKey = "batch-creator-" + query;
        return promptCache.computeIfAbsent(cacheKey, type -> {
            try{
                Resource resource = resourceLoader.getResource("classpath:prompts/stepik/batch-creator/" + query + ".txt");
                return resource.getContentAsString(StandardCharsets.UTF_8);
            }catch (IOException e) {
                log.error("Batch prompt not found for type: {}, will use fallback", query);
                return null;
            }
        });
    }

}
