package org.core.service.agent.analyzer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SectionAnalyzerService {

    @Value("${step.except.max.length}")
    private int stepExceptMaxLength;

    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;

    public String sectionSummeryBuilder(Section section) {
        StringBuilder sectionSummery = new StringBuilder();
        sectionSummery.append("Модуль ")
                .append(section.getPosition()).append(": ")
                .append(section.getTitle());

        if (section.getDescription() != null && !section.getDescription().isBlank()) {
            sectionSummery.append(" — ").append(section.getDescription().trim());
        }
        sectionSummery.append("\n");

        List<Lesson> lessonList = lessonRepository.findByModelIdOrderByPositionAsc(section.getId());
        if (lessonList.isEmpty()) {
            sectionSummery.append("(в модуле нет уроков)\n");
            return sectionSummery.toString();
        }

        for (Lesson lesson : lessonList) {
            sectionSummery.append(lessonSummeryBuilder(lesson, section)).append("\n");
        }

        return sectionSummery.toString();
    }

    public String lessonSummeryBuilder(Lesson lesson, Section section) {
        StringBuilder lessonSummery = new StringBuilder();
        List<Step> stepList = stepRepository.findByLessonIdOrderByPositionAsc(lesson.getId());

        lessonSummery.append("Модуль ")
                .append(section.getPosition())
                .append(" «")
                .append(section.getTitle())
                .append("» → Урок ")
                .append(lesson.getPosition())
                .append(" «")
                .append(lesson.getTitle())
                .append("», количество шагов: ")
                .append(stepList.size())
                .append("\n");

        if (stepList.isEmpty()) {
            lessonSummery.append("  (урок пустой)\n");
            return lessonSummery.toString();
        }

        lessonSummery.append("Типы шагов и их описание:\n");
        for (Step step : stepList) {
            lessonSummery.append("  ")
                    .append(step.getPosition())
                    .append(". [")
                    .append(step.getType())
                    .append("] ")
                    .append(buildStepExcerpt(step))
                    .append("\n");
        }

        return lessonSummery.toString();
    }

    private String buildStepExcerpt(Step step) {
        String content = step.getContent();
        if (content == null || content.isBlank()) {
            return "(без описания)";
        }

        String plain = content
                .replaceAll("<[^>]+>", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (plain.isEmpty()) {
            return "(без описания)";
        }
        if (plain.length() <= stepExceptMaxLength) {
            return plain;
        }
        return plain.substring(0, stepExceptMaxLength) + "...";
    }
}
