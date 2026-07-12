package org.core.service.agent.course.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.domain.Course;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.*;
import org.core.dto.agent.tools.*;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.YandexGptException;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.batch.BatchStepParser;
import org.core.service.agent.course.DeleteActionMetadataService;
import org.core.service.agent.course.tools.handler.CourseToolExecutor;
import org.core.service.agent.course.tools.util.CoursePlanMessageBuilder;
import org.core.service.agent.course.tools.util.ToolArgsHelper;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class CourseAgentLoop {

    @Value("${course.agent.loop.max.steps}")
    private int maxSteps;

    @Value("${course.agent.tools.prompt}")
    private String toolsPromptKey;

    @Value("${course.agent.max.tokens}")
    private int agentMaxTokens;

    private final CourseToolExecutor toolExecutor;
    private final CoursePlanMessageBuilder coursePlanMessageBuilder;
    private final SystemPromptService systemPromptService;
    private final LlmModelConfig llmModelConfig;
    private final BatchStepParser batchStepParser;
    private final ObjectMapper objectMapper;
    private final LlmProvider llmProvider;
    private final DeleteActionMetadataService deleteMetadataService;

    public CourseAgentLoop(CourseToolExecutor toolExecutor,
                           CoursePlanMessageBuilder coursePlanMessageBuilder,
                           SystemPromptService systemPromptService,
                           LlmModelConfig llmModelConfig,
                           BatchStepParser batchStepParser,
                           ObjectMapper objectMapper,
                           DeleteActionMetadataService deleteMetadataService,
                           @Qualifier("yandexProvider") LlmProvider llmProvider) {
        this.toolExecutor = toolExecutor;
        this.coursePlanMessageBuilder = coursePlanMessageBuilder;
        this.systemPromptService = systemPromptService;
        this.llmModelConfig = llmModelConfig;
        this.batchStepParser = batchStepParser;
        this.objectMapper = objectMapper;
        this.deleteMetadataService = deleteMetadataService;
        this.llmProvider = llmProvider;
    }

    public CourseAgentResponse run(Course course, Long userId, String sessionId, String userInput, LlmModel llmModel, List<ChatMessage> history) {
        CourseAgentContext courseAgentContext = new CourseAgentContext(course, userId, sessionId, userInput, llmModel, history);
        return runLoop(courseAgentContext, new ArrayList<>());
    }

    private CourseAgentResponse runLoop(CourseAgentContext courseAgentContext, List<ChatMessage> contextLoopMessages) {
        for (int step = 0; step < maxSteps; step++) {
            if (shouldForceShowPlan(contextLoopMessages, courseAgentContext)) {
                return showPlan(courseAgentContext,
                        "План готов. Проверьте действия и подтвердите — при необходимости уточните запрос.");
            }
            AgentStepResponse agentStep = callAgentLlm(courseAgentContext, contextLoopMessages);
            List<CourseToolCall> toolCalls = agentStep.getToolCalls();

            if (toolCalls == null || toolCalls.isEmpty()) {
                if (!courseAgentContext.getPendingActions().isEmpty()) {
                    return showPlan(courseAgentContext, firstNonBlank(agentStep.getMessage(), null));
                }
                return CourseAgentResponse.builder()
                        .action(CourseAgentAction.INFO_ANSWER)
                        .message(firstNonBlank(agentStep.getMessage(), "Готово."))
                        .build();
            }

            for (CourseToolCall toolCall : toolCalls) {
                if (CourseToolName.FINISH.name().equalsIgnoreCase(toolCall.getName())) {
                    String message = ToolArgsHelper.stringArg(toolCall.getArgs(), "message");
                    if (message == null) {
                        message = agentStep.getMessage();
                    }
                    if (courseAgentContext.getPendingActions().isEmpty()) {
                        return CourseAgentResponse.builder()
                                .action(CourseAgentAction.INFO_ANSWER)
                                .message(firstNonBlank(message, "Готово."))
                                .build();
                    }
                    return showPlan(courseAgentContext, firstNonBlank(message, null));
                }

                CourseToolResult toolResult = toolExecutor.execute(courseAgentContext, toolCall);
                CourseAgentResponse agentResponse = handleToolResult(courseAgentContext, toolCall, toolResult, contextLoopMessages);
                if (agentResponse != null) {
                    return agentResponse;
                }
            }
        }
        if (!courseAgentContext.getPendingActions().isEmpty()) {
            return showPlan(courseAgentContext,
                    "План собран. Проверьте и подтвердите — при необходимости уточните запрос в следующем сообщении.");
        }
        return CourseAgentResponse.error("Слишком много действий. Уточните запрос.");
    }

    public CourseAgentResponse resume(Course course, Long userId, String sessionId,
                                      AgentResumeContext resumeContext, EntityCandidateDTO candidate,
                                      LlmModel llmModel, List<ChatMessage> history) {
        if (resumeContext == null || resumeContext.getPendingTool() == null) {
            return CourseAgentResponse.error("Нет контекста для продолжения");
        }

        CourseAgentContext courseAgentContext = new CourseAgentContext(course, userId, sessionId, resumeContext.getUserInput(), llmModel, history);
        if (resumeContext.getCollectedActions() != null) {
            courseAgentContext.getPendingActions().addAll(resumeContext.getCollectedActions());
        }

        injectCandidate(resumeContext.getPendingArgs(), candidate);

        List<ChatMessage> loopMessages = new ArrayList<>();
        if (resumeContext.getLoopMessages() != null) {
            loopMessages.addAll(resumeContext.getLoopMessages());
        }

        CourseToolCall pendingCall = new CourseToolCall(resumeContext.getPendingTool(), resumeContext.getPendingArgs());

        CourseToolResult pendingResult = toolExecutor.execute(courseAgentContext, pendingCall);
        CourseAgentResponse pendingResponse = handleToolResult(courseAgentContext, pendingCall, pendingResult, loopMessages);
        if (pendingResponse != null) {
            return pendingResponse;
        }

        return runLoop(courseAgentContext, loopMessages);
    }

    private CourseAgentResponse handleToolResult(CourseAgentContext courseAgentContext, CourseToolCall toolCall,
                                                 CourseToolResult toolResult, List<ChatMessage> loopMessages) {
        if (toolResult.isImmediateExit()) {
            return toolResult.getImmediateResponse();
        }
        if (toolResult.isNeedsClarification()) {
            AgentResumeContext resumeContext = AgentResumeContext.builder()
                    .pendingTool(toolCall.getName())
                    .pendingArgs(toolCall.getArgs())
                    .collectedActions(new ArrayList<>(courseAgentContext.getPendingActions()))
                    .loopMessages(new ArrayList<>(loopMessages))
                    .userInput(courseAgentContext.getUserInput())
                    .clarificationMessage(toolResult.getClarificationMessage())
                    .build();
            return CourseAgentResponse.clarify(
                    toolResult.getClarificationMessage(),
                    toolResult.getCandidates(),
                    resumeContext);
        }
        if (!toolResult.isSuccess()) {
            loopMessages.add(toolMessage(toolCall.getName(), "Ошибка: " + toolResult.getPayload()));
            return null;
        }
        loopMessages.add(toolMessage(toolCall.getName(), toolResult.getPayload()));
        return null;
    }

    private AgentStepResponse callAgentLlm(CourseAgentContext courseAgentContext, List<ChatMessage> loopMessages) {
        String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(toolsPromptKey);
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.builder().role("system").content(systemPrompt).build());
        messages.addAll(courseAgentContext.getHistory());
        messages.add(ChatMessage.builder().role("user").content("ЗАПРОС ПОЛЬЗОВАТЕЛЯ:\n" + courseAgentContext.getUserInput()).build());
        for (ChatMessage loopMessage : loopMessages) {
            messages.add(loopMessage);
        }

        String modelUri = courseAgentContext.getLlmModel() != null ? llmModelConfig.getModelUri(courseAgentContext.getLlmModel()) : null;
        String aiResponse = llmProvider.chat(messages, modelUri, agentMaxTokens);
        String json = batchStepParser.extractJsonFromResponse(aiResponse);
        try {
            return objectMapper.readValue(json, AgentStepResponse.class);
        } catch (Exception ex) {
            log.error("Failed to parse agent step response: {}", ex.getMessage());
            throw new YandexGptException("Не удалось разобрать ответ агента: " + ex.getMessage());
        }
    }

    private CourseAgentResponse showPlan(CourseAgentContext courseAgentContext, String message) {
        String planMessage = firstNonBlank(message, coursePlanMessageBuilder.buildSummary(courseAgentContext.getPendingActions()));
        List<PlanActionDTO> actions = deleteMetadataService.prepareDeleteAction(
                courseAgentContext.getUserId(), new ArrayList<>(courseAgentContext.getPendingActions()));
        CoursePlanDTO coursePlan = CoursePlanDTO.builder()
                .message(planMessage)
                .actions(actions)
                .build();
        return CourseAgentResponse.builder()
                .action(CourseAgentAction.SHOW_PLAN)
                .message(coursePlan.getMessage())
                .plan(coursePlan)
                .build();
    }

    private ChatMessage toolMessage(String toolName, String payload) {
        return ChatMessage.builder()
                .role("user")
                .content("РЕЗУЛЬТАТ ИНСТРУМЕНТА " + toolName + ":\n" + payload)
                .build();
    }

    private void injectCandidate(Map<String, Object> args, EntityCandidateDTO candidate) {
        if (args == null || candidate == null) {
            return;
        }
        switch (candidate.getType()) {
            case "section" -> {
                args.put("sectionId", candidate.getId());
                args.put("sectionHint", candidate.getLabel());
            }
            case "lesson" -> {
                args.put("lessonId", candidate.getId());
                args.put("lessonHint", candidate.getLabel());
            }
            case "step" -> {
                args.put("stepId", candidate.getId());
                args.put("stepHint", candidate.getLabel());
            }
            default -> throw new IllegalArgumentException("Неизвестный тип выбранного варианта");
        }
    }

    private boolean shouldForceShowPlan(List<ChatMessage> loopMessages, CourseAgentContext courseAgentContext) {
        if (courseAgentContext.getPendingActions().isEmpty()) {
            return false;
        }
        long stepToolFailures = loopMessages.stream()
                .filter(message -> message.getContent() != null)
                .filter(message -> message.getContent().contains("PROPOSE_CREATE_STEPS"))
                .filter(message -> message.getContent().contains("Ошибка"))
                .count();
        return stepToolFailures >= 2;
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.trim();
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }
}
