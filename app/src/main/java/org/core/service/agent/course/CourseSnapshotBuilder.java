package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import org.core.domain.Course;
import org.core.domain.Section;
import org.core.repository.SectionRepository;
import org.core.service.agent.analyzer.SectionAnalyzerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseSnapshotBuilder {

    private final SectionRepository sectionRepository;
    private final SectionAnalyzerService sectionAnalyzerService;

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
}
