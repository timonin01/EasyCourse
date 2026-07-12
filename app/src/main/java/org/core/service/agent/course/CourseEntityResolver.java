package org.core.service.agent.course;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Course;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.domain.Step;
import org.core.dto.agent.course.EntityCandidateDTO;
import org.core.dto.agent.tools.EntityHints;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.core.repository.StepRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CourseEntityResolver {

    @Value("${course.entity.resolver.excerpt.length}")
    private int excerptLength;

    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final StepRepository stepRepository;

    public CourseResolution<Section> resolveSection(Long courseId, String sectionHint) {
        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(courseId);
        return resolve(sections,
                sectionHint,
                Section::getTitle,
                s -> buildSectionCandidate(s));
    }

    /**
     * Finds modules whose title (or a significant word from it) appears in the user text.
     * Used when the LLM omits sectionHint but the user named modules explicitly.
     */
    public List<Section> findSectionsMentionedInText(Long courseId, String text, java.util.Set<Long> excludeSectionIds) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String lowerText = text.toLowerCase();
        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(courseId);
        List<Section> matched = new ArrayList<>();
        for (Section section : sections) {
            if (excludeSectionIds != null && excludeSectionIds.contains(section.getId())) {
                continue;
            }
            if (isSectionMentionedInText(section, lowerText)) {
                matched.add(section);
            }
        }
        return matched;
    }

    private boolean isSectionMentionedInText(Section section, String lowerText) {
        String title = section.getTitle();
        if (title == null || title.isBlank()) {
            return false;
        }
        String lowerTitle = title.toLowerCase().trim();
        if (lowerText.contains(lowerTitle)) {
            return true;
        }
        for (String word : lowerTitle.split("\\W+")) {
            if (word.length() >= 3 && lowerText.contains(word)) {
                return true;
            }
        }
        return false;
    }


    public List<Lesson> findLessonsMentionedInText(Long courseId, String text, Set<Long> excludeLessonIds) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String lowerText = text.toLowerCase();
        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(courseId);
        List<Lesson> matched = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        if (excludeLessonIds != null) {
            seen.addAll(excludeLessonIds);
        }

        for (Section section : sections) {
            List<Lesson> sectionLessons = lessonRepository.findByModelIdOrderByPositionAsc(section.getId());
            for (Lesson lesson : sectionLessons) {
                if (seen.contains(lesson.getId())) {
                    continue;
                }
                if (isLessonMentionedInText(lesson, lowerText)) {
                    matched.add(lesson);
                    seen.add(lesson.getId());
                }
            }
        }

        for (Section section : sections) {
            if (!isSectionMentionedInText(section, lowerText)) {
                continue;
            }
            Long sectionId = section.getId();
            boolean hasLessonFromSection = matched.stream()
                    .anyMatch(lesson -> lesson.getSection().getId().equals(sectionId));
            if (hasLessonFromSection) {
                continue;
            }
            for (Lesson lesson : lessonRepository.findByModelIdOrderByPositionAsc(sectionId)) {
                if (seen.contains(lesson.getId())) {
                    continue;
                }
                matched.add(lesson);
                seen.add(lesson.getId());
            }
        }

        return matched;
    }

    public List<Lesson> findLessonsExplicitlyNamedInText(Long courseId, String text, Set<Long> excludeLessonIds) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String lowerText = text.toLowerCase();
        List<Section> sections = sectionRepository.findByCourseIdOrderByPositionAsc(courseId);
        List<Lesson> matched = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        if (excludeLessonIds != null) {
            seen.addAll(excludeLessonIds);
        }

        for (Section section : sections) {
            for (Lesson lesson : lessonRepository.findByModelIdOrderByPositionAsc(section.getId())) {
                if (seen.contains(lesson.getId())) {
                    continue;
                }
                if (isLessonMentionedInText(lesson, lowerText)) {
                    matched.add(lesson);
                    seen.add(lesson.getId());
                }
            }
        }
        return matched;
    }

    private boolean isLessonMentionedInText(Lesson lesson, String lowerText) {
        String title = lesson.getTitle();
        if (title == null || title.isBlank()) {
            return false;
        }
        String lowerTitle = title.toLowerCase().trim();
        if (lowerText.contains(lowerTitle)) {
            return true;
        }
        for (String word : lowerTitle.split("\\W+")) {
            if (word.length() >= 3 && lowerText.contains(word)) {
                return true;
            }
        }
        return false;
    }

    public CourseResolution<Lesson> resolveLesson(Long sectionId, String lessonHint) {
        List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(sectionId);
        return resolve(lessons,
                lessonHint,
                Lesson::getTitle,
                this::buildLessonCandidate);
    }

    public CourseResolution<Lesson> resolveLessonAcrossCourse(Long courseId, String lessonHint) {
        List<Lesson> lessons = new ArrayList<>();
        for (Section section : sectionRepository.findByCourseIdOrderByPositionAsc(courseId)) {
            lessons.addAll(lessonRepository.findByModelIdOrderByPositionAsc(section.getId()));
        }
        return resolve(lessons,
                lessonHint,
                Lesson::getTitle,
                this::buildLessonCandidate);
    }

    public CourseResolution<Lesson> resolveLesson(Course course, EntityHints hints) {
        if (hints.sectionHint() == null) {
            return resolveLessonAcrossCourse(course.getId(), hints.lessonHint());
        }

        CourseResolution<Section> sectionResolution =
                resolveSection(course.getId(), hints.sectionHint());
        if (sectionResolution.isFound()) {
            return resolveLesson(sectionResolution.value().getId(), hints.lessonHint());
        }
        if (sectionResolution.isAmbiguous()) {
            return CourseResolution.ambiguous(sectionResolution.candidates());
        }
        return CourseResolution.none();
    }

    public CourseResolution<Step> resolveStep(Long lessonId, String stepHint) {
        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lessonId);
        return resolve(steps,
                stepHint,
                step -> buildStepTitle(step),
                this::buildStepCandidate);
    }

    private <T> CourseResolution<T> resolve(List<T> orderedEntities, String hint,
                                            Function<T, String> titleFunction,
                                            Function<T, EntityCandidateDTO> candidateFunction) {
        if (orderedEntities.isEmpty()) {
            return CourseResolution.none();
        }
        Integer index = parseIndex(hint);
        if (index != null) {
            if (index >= 1 && index <= orderedEntities.size()) {
                return CourseResolution.found(orderedEntities.get(index - 1));
            }
            return CourseResolution.none();
        }
        if (hint != null && !hint.isBlank()) {
            String needle = hint.toLowerCase().trim();
            List<T> matches = new ArrayList<>();
            for (T item : orderedEntities) {
                String title = titleFunction.apply(item);
                if (title != null && title.toLowerCase().contains(needle)) {
                    matches.add(item);
                }
            }
            if (matches.size() == 1) {
                return CourseResolution.found(matches.get(0));
            }
            if (matches.size() > 1) {
                return CourseResolution.ambiguous(toCandidates(matches, candidateFunction));
            }
        }

        if (orderedEntities.size() == 1) {
            return CourseResolution.found(orderedEntities.get(0));
        }
        return CourseResolution.ambiguous(toCandidates(orderedEntities, candidateFunction));
    }

    private <T> List<EntityCandidateDTO> toCandidates(List<T> items, Function<T, EntityCandidateDTO> candidateFunction) {
        List<EntityCandidateDTO> result = new ArrayList<>();
        for (T item : items) {
            result.add(candidateFunction.apply(item));
        }
        return result;
    }

    private Integer parseIndex(String hint) {
        if (hint == null) {
            return null;
        }
        String trimmed = hint.trim();
        if (trimmed.matches("\\d+")) {
            try {
                return Integer.parseInt(trimmed);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private EntityCandidateDTO buildSectionCandidate(Section s) {
        return new EntityCandidateDTO("section", s.getId(),
                "Модуль " + s.getPosition() + ": " + s.getTitle());
    }

    private EntityCandidateDTO buildLessonCandidate(Lesson l) {
        String sectionTitle = l.getSection() != null ? l.getSection().getTitle() : "";
        String moduleSuffix = sectionTitle.isBlank() ? "" : " («" + sectionTitle + "»)";
        return new EntityCandidateDTO("lesson", l.getId(),
                "Урок " + l.getPosition() + ": " + l.getTitle() + moduleSuffix);
    }

    private EntityCandidateDTO buildStepCandidate(Step step) {
        return new EntityCandidateDTO("step", step.getId(),
                "Шаг " + step.getPosition() + " [" + step.getType() + "] " + buildStepTitle(step));
    }

    private String buildStepTitle(Step step) {
        String content = step.getContent();
        if (content == null || content.isBlank()) {
            return "(без описания)";
        }
        String plain = content.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        if (plain.isEmpty()) {
            return "(без описания)";
        }
        return plain.length() <= excerptLength ? plain : plain.substring(0, excerptLength) + "...";
    }
}
