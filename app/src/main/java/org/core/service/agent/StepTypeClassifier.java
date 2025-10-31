package org.core.service.agent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class StepTypeClassifier {
    
    private final ResourceLoader resourceLoader;
    private final LlmProvider llmProvider;
    
    private static final String CLASSIFIER_PROMPT_PATH = "classpath:prompts/stepik/classifier.txt";
    
    private static final Set<String> VALID_TYPES = Set.of(
        "choice", "matching", "sorting", "table", "fill-blanks",
        "text", "free-answer", "string", "number", "math", "random-tasks"
    );

    public String detectStepType(String userInput) {
        return classifyViaLLM(userInput);
    }

    private String classifyViaLLM(String userInput) {
        try {
            String classifierPrompt = loadClassifierPrompt();
            List<ChatMessage> messages = List.of(
                ChatMessage.builder()
                    .role("system")
                    .content(classifierPrompt)
                    .build(),
                ChatMessage.builder()
                    .role("user")
                    .content(userInput)
                    .build()
            );
            
            String aiResponse = llmProvider.chat(messages);
            String type = cleanResponse(aiResponse);
            if (VALID_TYPES.contains(type)) {
                return type;
            }
            throw new RuntimeException("Error classifying step type via LLM");
        } catch (RuntimeException e) {
            log.error("Error classifying step type via LLM: {}", e.getMessage(), e);
            throw new RuntimeException("Error classifying step type via LLM");
        }
    }

    private String cleanResponse(String aiResponse) {
        return aiResponse.trim()
            .toLowerCase()
            .replaceAll("[\"'.,!?]", "")
            .split("\\s+")[0];
    }

    private String loadClassifierPrompt() {
        try {
            Resource resource = resourceLoader.getResource(CLASSIFIER_PROMPT_PATH);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load classifier prompt", e);
        }
    }
}

