package org.core.service.agent.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.batchAnalyzer.BatchStepDTO;
import org.core.dto.agent.batchAnalyzer.BatchStepParser;
import org.core.dto.agent.batchAnalyzer.CountStepDTO;
import org.core.dto.stepik.step.StepikBlockRequest;
import org.core.service.agent.AgentService;
import org.core.service.agent.SystemPromptService;
import org.core.service.ai.YandexGptService;
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

    public List<StepikBlockRequest> generateBatchRequests(String sessionId, BatchStepDTO batchStepDTO) {
        if (batchStepDTO == null || batchStepDTO.getSteps() == null || batchStepDTO.getSteps().isEmpty()) {
            throw new RuntimeException("BatchStepDTO is null or empty");
        }

        List<StepikBlockRequest> stepikBlockRequests = new ArrayList<>();
        List<StepikBlockRequest> textBlockRequests = new ArrayList<>();
        for (CountStepDTO countStepDTO : batchStepDTO.getSteps()) {
            String type = countStepDTO.getType();
            String systemPrompt = systemPromptService.getPromptForQuery(type);

            boolean stepUseTextContext = countStepDTO.getUseSummarizedEnabled() == null || countStepDTO.getUseSummarizedEnabled();
            if (countStepDTO.getCount() == 1) {
                String userInput = countStepDTO.getSpecificInput();
                StepikBlockRequest request = agenService.generateStep(sessionId, userInput, type);
                stepikBlockRequests.add(request);
                if ("text".equals(type)) {
                    textBlockRequests.clear();
                    textBlockRequests.add(request);
                }
            } else {
                try {
                    String summariesContentFromTextBlock = null;
                    if (!"text".equals(type) && stepUseTextContext && !textBlockRequests.isEmpty()) {
                        summariesContentFromTextBlock = batchAnalyzerService.summariesTextSteps(textBlockRequests);
                    }
                    systemPrompt = promptModifierService.modifyPromptForBatch(systemPrompt, countStepDTO.getCount(), summariesContentFromTextBlock, type);
                    String userInputForBatch = countStepDTO.getSpecificInput();
                    List<StepikBlockRequest> batchBlockRequests = generateBatchSteps(userInputForBatch, systemPrompt, type, countStepDTO.getCount());
                    stepikBlockRequests.addAll(batchBlockRequests);
                    if ("text".equals(type)) {
                        textBlockRequests.clear();
                        textBlockRequests.addAll(batchBlockRequests);
                    }
                    log.info("Batch tasks successfully done for type {}", type);
                } catch (Exception ex) {
                    log.error("Batch generation failed for type {}, falling back to per-step generation: {}", type, ex.getMessage());
//                    String contextFromTextMessage = null;
//                    if (!"text".equals(type) && stepUseTextContext && !textBlockRequests.isEmpty()) {
//                        contextFromTextMessage = batchAnalyzerService.summariesTextSteps(textBlockRequests);
//                    }
//                    for (int i = 0; i < countStepDTO.getCount(); i++) {
//                        try {
//                            String individualInput = countStepDTO.getSpecificInput();
//                            if ("text".equals(type)) {
//                                individualInput = "теория " + individualInput;
//                            } else {
//                                individualInput += " (задание " + (i + 1) + " из " + countStepDTO.getCount() + ", уникальное)";
//                                if (contextFromTextMessage != null && !contextFromTextMessage.isBlank()) {
//                                    individualInput += "\n\nКонтекст из теории:\n" + contextFromTextMessage;
//                                }
//                            }
//                            StepikBlockRequest request = agenService.generateStep(sessionId, individualInput, type);
//                            stepikBlockRequests.add(request);
//                            if ("text".equals(type)) {
//                                textBlockRequests.add(request);
//                            }
//                            log.info("Successfully generated step {}/{} individually for type {}", i + 1, countStepDTO.getCount(), type);
//                        } catch (Exception individualError) {
//                            log.error("Failed to generate individual step {}/{} for type {}: {}",
//                                    i + 1, countStepDTO.getCount(), type, individualError.getMessage());
//                        }
//                    }
                }
            }
        }

        log.info("Generated list StepikBlockRequest for batch uploading, list: {}", stepikBlockRequests);
        return stepikBlockRequests;
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
