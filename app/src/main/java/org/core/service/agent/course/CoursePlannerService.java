package org.core.service.agent.course;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CoursePlanDTO;
import org.core.dto.agent.course.LessonPlanDTO;
import org.core.dto.agent.course.SectionPlanDTO;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.YandexGptException;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.batch.BatchStepParser;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class CoursePlannerService {

    private static final String PLAN_REVISION_PROMPT = "course-agent-plan-revision";

    @Value("${course.planner.max.tokens}")
    private int plannerMaxTokens;

    @Value("${course.section.planner.prompt}")
    private String sectionPlannerPrompt;

    @Value("${course.lesson.planner.prompt}")
    private String lessonPlannerPrompt;

    private final LlmProvider llmProvider;
    private final SystemPromptService systemPromptService;
    private final LlmModelConfig llmModelConfig;
    private final BatchStepParser batchStepParser;
    private final ObjectMapper objectMapper;

    public CoursePlannerService(@Qualifier("yandexProvider") LlmProvider llmProvider,
                                SystemPromptService systemPromptService,
                                LlmModelConfig llmModelConfig,
                                BatchStepParser batchStepParser,
                                ObjectMapper objectMapper) {
        this.llmProvider = llmProvider;
        this.systemPromptService = systemPromptService;
        this.llmModelConfig = llmModelConfig;
        this.batchStepParser = batchStepParser;
        this.objectMapper = objectMapper;
    }

    public SectionPlanDTO planSection(String courseSnapshot, String userInput, LlmModel llmModel) {
        return planSection(courseSnapshot, userInput, llmModel, List.of());
    }

    public SectionPlanDTO planSection(String courseSnapshot, String userInput, LlmModel llmModel,
                                      List<ChatMessage> history) {
        String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(sectionPlannerPrompt);
        String userContent = "СНИМОК КУРСА:\n" + courseSnapshot + "\n\nЗАПРОС ПОЛЬЗОВАТЕЛЯ:\n" + userInput;
        String json = callPlanner(systemPrompt, userContent, llmModel, history);
        try {
            SectionPlanDTO plan = objectMapper.readValue(json, SectionPlanDTO.class);
            if (plan.getLessons() == null) {
                plan.setLessons(Collections.emptyList());
            }
            return plan;
        } catch (Exception ex) {
            log.error("Failed to parse SectionPlanDTO from planner response: {}", ex.getMessage());
            throw new YandexGptException("Не удалось разобрать план модуля от LLM: " + ex.getMessage());
        }
    }

    public List<LessonPlanDTO> planLessons(String sectionSnapshot, String userInput, LlmModel llmModel) {
        return planLessons(sectionSnapshot, userInput, llmModel, List.of());
    }

    public List<LessonPlanDTO> planLessons(String sectionSnapshot, String userInput, LlmModel llmModel,
                                           List<ChatMessage> history) {
        String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(lessonPlannerPrompt);
        String userContent = "СНИМОК МОДУЛЯ:\n" + sectionSnapshot + "\n\nЗАПРОС ПОЛЬЗОВАТЕЛЯ:\n" + userInput;
        String json = callPlanner(systemPrompt, userContent, llmModel, history);
        try {
            SectionPlanDTO wrapper = objectMapper.readValue(json, SectionPlanDTO.class);
            return wrapper.getLessons() == null ? Collections.emptyList() : wrapper.getLessons();
        } catch (Exception ex) {
            log.error("Failed to parse lessons plan from planner response: {}", ex.getMessage());
            throw new YandexGptException("Не удалось разобрать план уроков от LLM: " + ex.getMessage());
        }
    }

    public CoursePlanDTO editPlan(CoursePlanDTO currentPlan, String instruction, LlmModel llmModel) {
        return editPlan(currentPlan, instruction, llmModel, List.of());
    }

    public CoursePlanDTO editPlan(CoursePlanDTO currentPlan, String instruction, LlmModel llmModel,
                                  List<ChatMessage> history) {
        try {
            String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(PLAN_REVISION_PROMPT);
            String userContent = "ТЕКУЩИЙ ПЛАН:\n"
                    + objectMapper.writeValueAsString(currentPlan)
                    + "\n\nКОРРЕКТИРОВКА ПОЛЬЗОВАТЕЛЯ:\n"
                    + instruction;
            String json = callPlanner(systemPrompt, userContent, llmModel, history);
            CoursePlanDTO editedPlan = objectMapper.readValue(json, CoursePlanDTO.class);

            editedPlan.setIntent(currentPlan.getIntent());
            editedPlan.setTargetSectionId(currentPlan.getTargetSectionId());
            editedPlan.setTargetSectionTitle(currentPlan.getTargetSectionTitle());
            editedPlan.setTargetLessonId(currentPlan.getTargetLessonId());
            editedPlan.setTargetLessonTitle(currentPlan.getTargetLessonTitle());
            return editedPlan;
        } catch (Exception ex) {
            log.error("Failed to revise course plan: {}", ex.getMessage());
            throw new YandexGptException("Не удалось скорректировать план: " + ex.getMessage());
        }
    }

    private String callPlanner(String systemPrompt, String userContent, LlmModel llmModel) {
        return callPlanner(systemPrompt, userContent, llmModel, List.of());
    }

    private String callPlanner(String systemPrompt, String userContent, LlmModel llmModel,
                               List<ChatMessage> history) {
        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.builder().role("system").content(systemPrompt).build());
        if (history != null) {
            messages.addAll(history);
        }
        messages.add(ChatMessage.builder().role("user").content(userContent).build());
        String modelUri = llmModel != null ? llmModelConfig.getModelUri(llmModel) : null;
        String aiResponse = llmProvider.chat(messages, modelUri, plannerMaxTokens);
        log.info("Planner LLM response (length={})", aiResponse != null ? aiResponse.length() : 0);
        return batchStepParser.extractJsonFromResponse(aiResponse);
    }
}
