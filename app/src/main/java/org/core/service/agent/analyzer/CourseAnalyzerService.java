package org.core.service.agent.analyzer;

import lombok.extern.slf4j.Slf4j;
import org.core.config.LlmModelConfig;
import org.core.domain.Course;
import org.core.domain.Section;
import org.core.dto.agent.ChatMessage;
import org.core.dto.agent.CourseAnalyzerDTO;
import org.core.enums.LlmModel;
import org.core.exception.exceptions.CourseNotFoundException;
import org.core.repository.CourseRepository;
import org.core.repository.SectionRepository;
import org.core.service.agent.SystemPromptService;
import org.core.service.agent.llmProvider.LlmProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@Transactional(readOnly = true)
public class CourseAnalyzerService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final SectionAnalyzerService sectionAnalyzerService;
    private final SystemPromptService systemPromptService;
    private final LlmProvider llmProvider;
    private final LlmModelConfig llmModelConfig;

    @Value("${course.analyzer.max-output-tokens}")
    private int analyzerMaxOutputTokens;

    public CourseAnalyzerService(@Qualifier("yandexProvider") LlmProvider llmProvider,
                                 SystemPromptService systemPromptService,
                                 CourseRepository courseRepository,
                                 SectionRepository sectionRepository,
                                 SectionAnalyzerService sectionAnalyzerService,
                                 LlmModelConfig llmModelConfig) {
        this.llmProvider = llmProvider;
        this.systemPromptService = systemPromptService;
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.sectionAnalyzerService = sectionAnalyzerService;
        this.llmModelConfig = llmModelConfig;
    }

    public CourseAnalyzerDTO courseAnalyze(Long userId, Long courseId, LlmModel llmModel) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CourseNotFoundException("Course not found"));
        if (!course.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("Course does not belong to user");
        }

        String courseSnapshot = buildCourseSnapshot(course);
        log.info("Built course snapshot for courseId={}, length={}", courseId, courseSnapshot.length());

        return analyzeSectionsSummeryByLLMChat(courseSnapshot, llmModel);
    }

    private String buildCourseSnapshot(Course course) {
        StringBuilder courseSnapshot = new StringBuilder();
        courseSnapshot.append("Курс: «").append(course.getTitle()).append("»\n");
        if (course.getDescription() != null && !course.getDescription().isBlank()) {
            courseSnapshot.append("Описание курса: ").append(course.getDescription().trim()).append("\n");
        }
        courseSnapshot.append("\n");

        List<Section> sectionList = sectionRepository.findByCourseIdOrderByPositionAsc(course.getId());
        if (sectionList.isEmpty()) {
            courseSnapshot.append("(в курсе пока нет модулей)\n");
            return courseSnapshot.toString();
        }

        for (Section section : sectionList) {
            courseSnapshot.append(sectionAnalyzerService.sectionSummeryBuilder(section)).append("\n");
        }

        return courseSnapshot.toString();
    }

    private CourseAnalyzerDTO analyzeSectionsSummeryByLLMChat(String sectionSummery, LlmModel llmModel) {
        String systemPrompt = systemPromptService.getAnalyzerPromptByQuery("course-analyzer");
        List<ChatMessage> messages = List.of(
                ChatMessage.builder()
                        .role("system")
                        .content(systemPrompt)
                        .build(),
                ChatMessage.builder()
                        .role("user")
                        .content(sectionSummery)
                        .build()
        );

        String modelUri = llmModel != null ? llmModelConfig.getModelUri(llmModel) : null;
        String aiResponse = llmProvider.chat(messages, modelUri, analyzerMaxOutputTokens);

        log.info("Received course analyzer response, length={}, maxOutputTokens={}",
                aiResponse != null ? aiResponse.length() : 0,
                analyzerMaxOutputTokens
        );
        return new CourseAnalyzerDTO(aiResponse);
    }
}
