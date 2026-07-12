package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.service.agent.analyzer.SectionAnalyzerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseSnapshotBuilder {

    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final SectionAnalyzerService sectionAnalyzerService;

    public String buildStructureIndex(Course course) {
        StringBuilder index = new StringBuilder();
        index.append("СПРАВОЧНИК — УЖЕ СУЩЕСТВУЮЩАЯ СТРУКТУРА КУРСА ");
        index.append("(не предлагай эти названия как новые модули или уроки):\n");

        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(course.getId());
        if (sections.isEmpty()) {
            index.append("(в курсе пока нет модулей)\n");
            return index.toString();
        }

        for (Section section : sections) {
            index.append("- Модуль «").append(section.getTitle()).append("»");
            List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(section.getId());
            if (lessons.isEmpty()) {
                index.append(" — уроков нет\n");
            } else {
                String lessonTitles = lessons.stream()
                        .map(lesson -> "«" + lesson.getTitle() + "»")
                        .collect(Collectors.joining(", "));
                index.append(" — уроки: ").append(lessonTitles).append('\n');
            }
        }
        return index.toString();
    }

    public String buildCourseSnapshot(Course course) {
        StringBuilder courseSnapshot = new StringBuilder();
        courseSnapshot.append("Курс: ").append(course.getTitle()).append("\n");
        if (course.getDescription() != null && !course.getDescription().isBlank()) {
            courseSnapshot.append("Описание курса: ").append(course.getDescription().trim()).append("\n");
        }
        courseSnapshot.append("\n");

        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(course.getId());
        if (sections.isEmpty()) {
            courseSnapshot.append("(в курсе пока нет модулей)\n");
            return courseSnapshot.toString();
        }
        for (Section section : sections) {
            courseSnapshot.append(sectionAnalyzerService.sectionSummeryBuilder(section)).append("\n");
        }
        return courseSnapshot.toString();
    }

    public String buildSectionSnapshot(Section section) {
        return sectionAnalyzerService.sectionSummeryBuilder(section);
    }

    public String buildSectionSnapshot(Section section, Course course) {
        StringBuilder snapshot = new StringBuilder();
        snapshot.append("Курс: ").append(course.getTitle()).append('\n');
        if (course.getDescription() != null && !course.getDescription().isBlank()) {
            snapshot.append("Описание курса: ").append(course.getDescription().trim()).append('\n');
        }
        snapshot.append('\n');
        snapshot.append(sectionAnalyzerService.sectionSummeryBuilder(section));
        return snapshot.toString();
    }
}
