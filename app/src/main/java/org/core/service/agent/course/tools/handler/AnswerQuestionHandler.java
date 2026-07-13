package org.core.service.agent.course.tools.handler;

import org.core.config.LlmModelConfig;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.course.CourseAgentAction;
import org.core.dto.agent.course.CourseAgentResponse;
import org.core.dto.agent.tools.CourseAgentContext;
import org.core.dto.agent.tools.CourseToolResult;
import org.core.dto.agent.tools.EntityHints;
import org.core.repository.StepRepository;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.analyzer.SectionAnalyzerService;
import org.core.service.agent.course.CourseEntityResolver;
import org.core.service.agent.course.CourseResolution;
import org.core.service.agent.course.CourseSnapshotBuilder;
import org.core.service.agent.course.tools.util.ContextHintParser;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class AnswerQuestionHandler {

    @Value("${course.planner.max.tokens}")
    private int maxTokens;

    @Value("${course.info.answer.prompt}")
    private String infoAnswerPrompt;

    @Value("${course.info.answer.ask.prompt}")
    private String infoAnswerAskPrompt;

    private final SystemPromptService systemPromptService;
    private final LlmModelConfig llmModelConfig;
    private final LlmProvider llmProvider;
    private final CourseEntityResolver entityResolver;
    private final SectionAnalyzerService sectionAnalyzerService;
    private final StepRepository stepRepository;
    private final CourseSnapshotBuilder courseSnapshotBuilder;

    public AnswerQuestionHandler(
            SystemPromptService systemPromptService,
            LlmModelConfig llmModelConfig,
            @Qualifier("yandexProvider") LlmProvider llmProvider,
            CourseEntityResolver entityResolver,
            SectionAnalyzerService sectionAnalyzerService,
            StepRepository stepRepository,
            CourseSnapshotBuilder courseSnapshotBuilder){
      this.systemPromptService = systemPromptService;
      this.llmModelConfig = llmModelConfig;
      this.llmProvider = llmProvider;
        this.entityResolver = entityResolver;
        this.sectionAnalyzerService = sectionAnalyzerService;
        this.stepRepository = stepRepository;
        this.courseSnapshotBuilder = courseSnapshotBuilder;
    }

    public CourseToolResult handleAnswerQuestion(CourseAgentContext courseAgentContext, Map<String, Object> args) {
        EntityHints hints = ContextHintParser.mergeAll(
                EntityHints.fromArgs(args),
                ContextHintParser.parseFromUserInput(courseAgentContext.getUserInput()),
                ContextHintParser.parseFromHistory(courseAgentContext.getHistory()));
        if (isWholeCourseQuestion(courseAgentContext.getUserInput())) {
            hints = ContextHintParser.mergeAll(
                    EntityHints.fromArgs(args),
                    ContextHintParser.parseFromUserInput(courseAgentContext.getUserInput()));
        }
        String context = buildQueryContext(courseAgentContext.getCourse(), hints, courseAgentContext.getUserInput());
        String promptKey = courseAgentContext.isAskMode() ? infoAnswerAskPrompt : infoAnswerPrompt;
        String systemPrompt = systemPromptService.getAnalyzerPromptByQuery(promptKey);

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.builder().role("system").content(systemPrompt).build());
        messages.addAll(courseAgentContext.getHistory());
        messages.add(ChatMessage.builder().role("user").content(
                "КОНТЕКСТ:\n" + context + "\n\nВОПРОС ПОЛЬЗОВАТЕЛЯ:\n" + courseAgentContext.getUserInput()).build());

        String modelUri = courseAgentContext.getLlmModel() != null ? llmModelConfig.getModelUri(courseAgentContext.getLlmModel()) : null;
        String answer = llmProvider.chat(messages, modelUri, maxTokens);

        return CourseToolResult.immediate(CourseAgentResponse.builder()
                .action(CourseAgentAction.INFO_ANSWER)
                .message(answer == null || answer.isBlank()
                        ? "Не удалось сформировать ответ. Уточните вопрос."
                        : answer.trim())
                .build());
    }

    private String buildQueryContext(Course course, EntityHints hints, String userInput) {
        StringBuilder context = new StringBuilder(courseSnapshotBuilder.buildStructureIndex(course));
        context.append('\n');

        if (hints.sectionHint() != null && isRecommendationQuestion(userInput)) {
            CourseResolution<Section> sectionResolution =
                    entityResolver.resolveSection(course.getId(), hints.sectionHint());
            if (sectionResolution.isFound()) {
                context.append("--- Детали текущего модуля ---\n");
                context.append(sectionAnalyzerService.sectionSummeryBuilder(sectionResolution.value()));
                return context.toString();
            }
        }

        if (hints.stepHint() != null) {
            CourseResolution<Lesson> lessonResolution = entityResolver.resolveLesson(course, hints);
            if (lessonResolution.isFound()) {
                Lesson lesson = lessonResolution.value();
                context.append("--- Детали текущего урока ---\n");
                context.append(sectionAnalyzerService.lessonSummeryBuilder(lesson, lesson.getSection()));
                Integer stepIndex = parseIndex(hints.stepHint());
                if (stepIndex != null) {
                    List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId());
                    if (stepIndex >= 1 && stepIndex <= steps.size()) {
                        context.append("\nДетали шага ").append(stepIndex).append(":\n");
                        context.append(buildStepDetail(steps.get(stepIndex - 1)));
                    }
                }
                return context.toString();
            }
        }
        if (hints.lessonHint() != null) {
            CourseResolution<Lesson> lessonResolution = entityResolver.resolveLesson(course, hints);
            if (lessonResolution.isFound()) {
                Lesson lesson = lessonResolution.value();
                context.append("--- Детали текущего урока ---\n");
                context.append(sectionAnalyzerService.lessonSummeryBuilder(lesson, lesson.getSection()));
                return context.toString();
            }
        }
        if (hints.sectionHint() != null) {
            CourseResolution<Section> sectionResolution =
                    entityResolver.resolveSection(course.getId(), hints.sectionHint());
            if (sectionResolution.isFound()) {
                context.append("--- Детали текущего модуля ---\n");
                context.append(sectionAnalyzerService.sectionSummeryBuilder(sectionResolution.value()));
                return context.toString();
            }
        }

        context.append("--- Полная структура курса ---\n");
        context.append(courseSnapshotBuilder.buildCourseSnapshot(course));
        return context.toString();
    }

    private boolean isWholeCourseQuestion(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return false;
        }
        String lower = userInput.toLowerCase();
        return lower.contains("в сам курс")
                || lower.contains("во весь курс")
                || lower.contains("в весь курс")
                || lower.contains("по всему курсу")
                || lower.contains("в курс что")
                || lower.contains("в курс можно")
                || (lower.contains("в курс") && (lower.contains("добав") || lower.contains("ещ")))
                || lower.contains("не хватает в курсе")
                || lower.contains("чего не хватает в курсе");
    }

    private boolean isRecommendationQuestion(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return false;
        }
        String lower = userInput.toLowerCase();
        return lower.contains("добав")
                || lower.contains("не хвата")
                || lower.contains("чего не")
                || lower.contains("что ещ")
                || lower.contains("какие ещ")
                || lower.contains("предлож")
                || lower.contains("рекоменд");
    }

    private String buildStepDetail(Step step) {
        StringBuilder detail = new StringBuilder();
        detail.append("Тип: ").append(step.getType()).append("\n");
        if (step.getContent() != null && !step.getContent().isBlank()) {
            String plain = step.getContent()
                    .replaceAll("<[^>]+>", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            detail.append("Содержание: ").append(plain).append("\n");
        }
        return detail.toString();
    }

    private Integer parseIndex(String hint) {
        if (hint == null || !hint.trim().matches("\\d+")) {
            return null;
        }
        try {
            return Integer.parseInt(hint.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

}
