package org.core.service.agent.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.AgentService;
import org.core.service.agent.SystemPromptService;
import org.core.service.ai.yandex.YandexGptService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchGeneratorService {

    @Value("${yandex.gpt.api.model-uri.batch}")
    private String batchModelUri;

    private final YandexGptService yandexGptService;
    private final SystemPromptService systemPromptService;
    private final AgentService agenService;
    private final BatchStepParser batchStepParser;
    private final BatchPromptModifierService promptModifierService;
    private final BatchAnalyzerService batchAnalyzerService;

    public List<StepikBlockRequest> generateBatchRequests(Long userId, String sessionId, BatchStepDTO batchStepDTO) {
        return generateBatchRequests(userId, sessionId, batchStepDTO, List.of());
    }

    public List<StepikBlockRequest> generateBatchRequests(Long userId, String sessionId, BatchStepDTO batchStepDTO,
                                                        List<StepikBlockRequest> externalTextContext) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null || batchStepDTO.getSteps().isEmpty()) {
            throw new RuntimeException("BatchStepDTO is null or empty");
        }

        List<StepikBlockRequest> stepikBlockRequests = new ArrayList<>();
        List<StepikBlockRequest> priorTheory = externalTextContext == null
                ? new ArrayList<>()
                : new ArrayList<>(externalTextContext);
        List<StepikBlockRequest> generatedTextInBatch = new ArrayList<>();
        for (CountStepDTO countStepDTO : batchStepDTO.getSteps()) {
            String type = countStepDTO.getType();
            String systemPrompt = systemPromptService.getPromptForQuery(type);

            boolean stepUseTextContext = countStepDTO.getUseSummarizedEnabled() == null || countStepDTO.getUseSummarizedEnabled();
            if (countStepDTO.getCount() == 1) {
                String userInput = countStepDTO.getSpecificInput();
                if (!"text".equals(type) && stepUseTextContext) {
                    userInput = appendTheoryContext(userInput, priorTheory, generatedTextInBatch);
                }
                StepikBlockRequest request = agenService.generateStep(userId, sessionId, userInput, type, null, false);
                stepikBlockRequests.add(request);
                if ("text".equals(type)) {
                    generatedTextInBatch.clear();
                    generatedTextInBatch.add(request);
                }
            } else {
                try {
                    String summariesContentFromTextBlock = null;
                    if (!"text".equals(type) && stepUseTextContext) {
                        List<StepikBlockRequest> allText = mergeTextBlocks(priorTheory, generatedTextInBatch);
                        if (!allText.isEmpty()) {
                            summariesContentFromTextBlock = batchAnalyzerService.summariesTextSteps(allText);
                        }
                    }
                    systemPrompt = promptModifierService.modifyPromptForBatch(systemPrompt, countStepDTO.getCount(), summariesContentFromTextBlock, type);
                    String userInputForBatch = countStepDTO.getSpecificInput();
                    List<StepikBlockRequest> batchBlockRequests = generateBatchSteps(userInputForBatch, systemPrompt, type, countStepDTO.getCount());
                    stepikBlockRequests.addAll(batchBlockRequests);
                    if ("text".equals(type)) {
                        generatedTextInBatch.clear();
                        generatedTextInBatch.addAll(batchBlockRequests);
                    }
                    log.info("Batch tasks successfully done for type {}", type);
                } catch (Exception ex) {
                    log.error("Batch generation failed for type {}, falling back to per-step generation: {}", type, ex.getMessage());
                }
            }
        }

        log.info("Generated list StepikBlockRequest for batch uploading, list: {}", stepikBlockRequests);
        return stepikBlockRequests;
    }

    private List<StepikBlockRequest> mergeTextBlocks(List<StepikBlockRequest> priorTheory,
                                                     List<StepikBlockRequest> generatedTextInBatch) {
        List<StepikBlockRequest> allText = new ArrayList<>();
        if (priorTheory != null) {
            allText.addAll(priorTheory);
        }
        if (generatedTextInBatch != null) {
            allText.addAll(generatedTextInBatch);
        }
        return allText;
    }

    private String appendTheoryContext(String userInput, List<StepikBlockRequest> priorTheory,
                                       List<StepikBlockRequest> generatedTextInBatch) {
        List<StepikBlockRequest> allText = mergeTextBlocks(priorTheory, generatedTextInBatch);
        if (allText.isEmpty()) {
            return userInput;
        }
        String summary = batchAnalyzerService.summariesTextSteps(allText);
        if (summary == null || summary.isBlank()) {
            return userInput;
        }
        return userInput + "\n\nКонтекст из теории урока:\n" + summary;
    }

    private List<StepikBlockRequest> generateBatchSteps(String userInput, String systemPrompt, String stepType, int count) {
        try {
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
            int maxTokens = "text".equals(stepType) ? 12000 : 10000;
            String aiResponse = yandexGptService.generateResponse(messages, true, maxTokens, batchModelUri, false);
            log.info("Get response from llm for list StepikBlockRequest: {}", aiResponse);

            return batchStepParser.parseAiResponseToRequestsList(aiResponse, stepType, count);
        } catch (Exception e) {
            log.error("Error generating batch steps: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate batch steps: " + e.getMessage(), e);
        }
    }
}
