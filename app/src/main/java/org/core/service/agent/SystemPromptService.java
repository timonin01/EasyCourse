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
    
    public String getPromptForStepType(String stepType) {
        return promptCache.computeIfAbsent(stepType, type -> {
            try {
                Resource resource = resourceLoader.getResource("classpath:prompts/stepik/" + type + ".txt");
                return resource.getContentAsString(StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new RuntimeException("Prompt not found for type: {}, using default");
            }
        });
    }

}
