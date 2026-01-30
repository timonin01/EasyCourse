package org.core.service.agent.batch;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.BatchStepParser;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.dto.stepik.step.text.StepikBlockTextRequest;
import org.core.exception.exceptions.YandexGptException;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

@Service
@Slf4j
public class BatchAnalyzerService {

    private final ExecutorService executorService;
    private final SystemPromptService systemPromptService;
    private final LlmProvider llmProvider;
    private final BatchStepParser batchStepParser;

    private final ObjectMapper objectMapper;

    public BatchAnalyzerService(@Qualifier("yandexProvider") LlmProvider llmProvider,
                                @Qualifier("virtualExecutor") ExecutorService executorService,
                                 SystemPromptService systemPromptService,
                                 ObjectMapper objectMapper,
                                 BatchStepParser batchStepParser){
        this.llmProvider = llmProvider;
        this.executorService = executorService;
        this.systemPromptService = systemPromptService;
        this.objectMapper = objectMapper;
        this.batchStepParser = batchStepParser;
    }

    public BatchStepDTO analyzeUserInput(String userInput) {
        String systemPrompt = systemPromptService.getPromptForQuery("batch-analyzer");
        List<ChatMessage> messages = List.of(
                ChatMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .build(),
                ChatMessage.builder()
                        .role("user")
                        .content(userInput)
                        .build()
        );

        String aiResponse = llmProvider.chat(messages);
        log.info("Get response from llm for BatchStepDTO: {}", aiResponse);

        try {
            String json = batchStepParser.extractJsonFromResponse(aiResponse);
            return objectMapper.readValue(json, BatchStepDTO.class);
        } catch (Exception ex) {
            log.error("Failed to parse BatchStepDTO from response: {}", ex.getMessage());
            throw new YandexGptException("Failed to parse batch analysis: " + ex.getMessage());
        }
    }

    public String summariesTextSteps(List<StepikBlockRequest> requests) {
        if(requests == null){
            throw new RuntimeException("List<StepikBlockRequest> requests is null");
        }
        String systemPrompt = systemPromptService.getPromptForQuery("text-summary");

        List<CompletableFuture<String>> textSummaryFuture = new ArrayList<>();
        for (StepikBlockRequest request : requests) {
            textSummaryFuture.add(CompletableFuture.supplyAsync(() -> {
                String content;
                if (request instanceof StepikBlockTextRequest textRequest) {
                    String rawHtml = textRequest.getText() != null ? textRequest.getText() : "";
                    content = rawHtml.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
                } else {
                    try {
                        content = objectMapper.writeValueAsString(request);
                    } catch (Exception e) {
                        content = "";
                    }
                }

                List<ChatMessage> messages = List.of(
                        ChatMessage.builder()
                                .role("system")
                                .content(systemPrompt)
                                .build(),
                        ChatMessage.builder()
                                .role("user")
                                .content(content)
                                .build()
                );
                return llmProvider.chat(messages);
            }, executorService));
        }

        CompletableFuture<Void> allFutures = CompletableFuture.allOf(textSummaryFuture.toArray(new CompletableFuture[0]));
        allFutures.join();

        List<String> results = textSummaryFuture.stream()
                .map(CompletableFuture::join)
                .toList();

        return String.join("\n", results);

    }

}
