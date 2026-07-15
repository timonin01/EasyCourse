package org.core.service.agent.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.config.StepGenerationTokenConfig;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.enums.LlmModel;
import org.core.service.agent.AgentService;
import org.core.service.agent.SystemPromptService;
import org.core.service.ai.ProvodAiService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchGeneratorService {

    private final LlmModelConfig llmModelConfig;
    private final StepGenerationTokenConfig stepGenerationTokenConfig;
    private final ProvodAiService provodAiService;
    private final SystemPromptService systemPromptService;
    private final AgentService agenService;
    private final BatchStepParser batchStepParser;
    private final BatchPromptModifierService promptModifierService;
    private final BatchAnalyzerService batchAnalyzerService;

    public List<StepikBlockRequest> generateBatchRequests(Long userId, String sessionId, BatchStepDTO batchStepDTO) {
        return generateBatchRequests(userId, sessionId, batchStepDTO, List.of(), null, null);
    }

    public List<StepikBlockRequest> generateBatchRequests(Long userId, String sessionId, BatchStepDTO batchStepDTO,
                                                          List<StepikBlockRequest> externalTextContext,
                                                          LlmModel llmModel,
                                                          TheorySummaryCache theorySummaryCache) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null || batchStepDTO.getSteps().isEmpty()) {
            throw new RuntimeException("BatchStepDTO is null or empty");
        }

        TheorySummaryCache summaryCache = theorySummaryCache != null ? theorySummaryCache : new TheorySummaryCache();
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
                    userInput = appendTheoryContext(userInput, priorTheory, generatedTextInBatch, llmModel, summaryCache);
                }
                StepikBlockRequest request = agenService.generateStep(
                        userId, sessionId, userInput, type, llmModel, false);
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
                            summariesContentFromTextBlock = summarizeTheory(allText, llmModel, summaryCache);
                        }
                    }
                    systemPrompt = promptModifierService.modifyPromptForBatch(
                            systemPrompt, countStepDTO.getCount(), summariesContentFromTextBlock, type);
                    String userInputForBatch = countStepDTO.getSpecificInput();
                    List<StepikBlockRequest> batchBlockRequests = generateBatchSteps(
                            userInputForBatch, systemPrompt, type, countStepDTO.getCount(), llmModel);
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
                                       List<StepikBlockRequest> generatedTextInBatch, LlmModel llmModel,
                                       TheorySummaryCache summaryCache) {
        List<StepikBlockRequest> allText = mergeTextBlocks(priorTheory, generatedTextInBatch);
        if (allText.isEmpty()) {
            return userInput;
        }
        String summary = summarizeTheory(allText, llmModel, summaryCache);
        if (summary == null || summary.isBlank()) {
            return userInput;
        }
        return userInput + "\n\nКонтекст из теории урока:\n" + summary;
    }

    private String summarizeTheory(List<StepikBlockRequest> textBlocks, LlmModel llmModel, TheorySummaryCache summaryCache) {
        return summaryCache.getOrCompute(textBlocks, blocks -> {
            log.info("Computing theory summary for {} text block(s)", blocks.size());
            return batchAnalyzerService.summariesTextSteps(blocks, llmModel);
        });
    }

    private List<StepikBlockRequest> generateBatchSteps(String userInput, String systemPrompt, String stepType,
                                                        int count, LlmModel llmModel) {
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
            int maxTokens = stepGenerationTokenConfig.getBatchMaxTokens();
            String batchModel = llmModel != null
                    ? llmModelConfig.getModelUri(llmModel)
                    : llmModelConfig.getDefaultModelUri();
            String aiResponse = provodAiService.generateResponse(messages, true, maxTokens, batchModel, false);
            log.info("Get response from llm for list StepikBlockRequest: {}", aiResponse);

            return batchStepParser.parseAiResponseToRequestsList(aiResponse, stepType, count);
        } catch (Exception e) {
            log.error("Error generating batch steps: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate batch steps: " + e.getMessage(), e);
        }
    }
}
