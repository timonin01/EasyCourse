package org.core.service.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Section;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.exception.exceptions.LessonNotFoundException;
import org.core.exception.exceptions.SectionNotFoundException;
import org.core.repository.LessonRepository;
import org.core.repository.SectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class LessonService {

    private final LessonRepository lessonRepository;
    private final SectionRepository sectionRepository;

    public LessonResponseDTO createLesson(CreateLessonDTO createDTO) {
        Section section = sectionRepository.findById(createDTO.getSectionId())
            .orElseThrow(() -> new SectionNotFoundException("Section not found"));
        
        Integer position = getNextPosition(section.getId());

        Lesson lesson = new Lesson();
        lesson.setSection(section);
        lesson.setTitle(createDTO.getTitle());
        lesson.setPosition(position);

        log.info("Created new lesson with ID: {} in section: {} at position {}", lesson.getId(), section.getId(), position);
        return mapToResponseDTO(lessonRepository.save(lesson));
    }

    public Lesson createLessonFromDTO(LessonResponseDTO lessonResponseDTO){
        Section section = sectionRepository.findById(lessonResponseDTO.getSectionId())
                .orElseThrow(() -> new SectionNotFoundException("Section not found"));

        Lesson lesson = Lesson.builder()
                .section(section)
                .title(lessonResponseDTO.getTitle())
                .position(lessonResponseDTO.getPosition())
                .stepikLessonId(lessonResponseDTO.getStepikLessonId())
                .createdAt(lessonResponseDTO.getCreatedAt())
                .updatedAt(lessonResponseDTO.getUpdatedAt())
                .build();
        return lessonRepository.save(lesson);
    }

    public LessonResponseDTO getLessonByLessonID(Long lessonId) {
        Lesson lesson = findLessonById(lessonId);
        return mapToResponseDTO(lesson);
    }

    public List<LessonResponseDTO> getSectionLessonsBySectionId(Long sectionId) {
        List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(sectionId);
        return lessons.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public LessonResponseDTO updateLesson(UpdateLessonDTO updateDTO) {
        Lesson lesson = findLessonById(updateDTO.getLessonId());
        if (updateDTO.getTitle() != null) {
            lesson.setTitle(updateDTO.getTitle());
        }
        if (updateDTO.getPosition() != null && !updateDTO.getPosition().equals(lesson.getPosition())) {
            changeLessonPosition(lesson, updateDTO.getPosition());
        }

        log.info("Updated lesson with ID: {}", updateDTO.getLessonId());
        return mapToResponseDTO(lessonRepository.save(lesson));
    }

    public void deleteLesson(Long lessonId) {
        Lesson lesson = findLessonById(lessonId);
        Long sectionId = lesson.getSection().getId();
        Integer position = lesson.getPosition();

        lessonRepository.delete(lesson);
        reorderLessonsAfterDeletion(sectionId, position);
        
        log.info("Deleted lesson with ID: {} from section: {}", lessonId, sectionId);
    }

    private Lesson findLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId)
            .orElseThrow(() -> new LessonNotFoundException("Lesson not found"));
    }

    private Integer getNextPosition(Long sectionId) {
        return lessonRepository.findMaxPositionByModelId(sectionId)
            .map(pos -> pos + 1)
            .orElse(1);
    }

    private void shiftLessonsPositions(Long sectionId, Integer fromPosition) {
        lessonRepository.incrementPositionsFromPosition(sectionId, fromPosition);
    }

    private void changeLessonPosition(Lesson lesson, Integer newPosition) {
        Long sectionId = lesson.getSection().getId();
        Integer oldPosition = lesson.getPosition();
        if (newPosition < oldPosition) {
            lessonRepository.incrementPositionsRange(sectionId, newPosition, oldPosition - 1);
        } else {
            lessonRepository.decrementPositionsRange(sectionId, oldPosition + 1, newPosition);
        }
        lesson.setPosition(newPosition);
    }

    private void reorderLessonsAfterDeletion(Long sectionId, Integer deletedPosition) {
        lessonRepository.decrementPositionsFromPosition(sectionId, deletedPosition);
    }

    public List<LessonResponseDTO> getUnsyncedLessonsBySectionId(Long sectionId) {
        List<Lesson> lessons = lessonRepository.findByModelIdAndStepikLessonIdIsNullOrderByPositionAsc(sectionId);
        return lessons.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public void updateLessonStepikLessonId(Long lessonId, Long stepikLessonId) {
        lessonRepository.updateStepikLessonId(lessonId, stepikLessonId);
        log.info("Updated lesson {} with stepikLessonId: {}", lessonId, stepikLessonId);
    }

    public void updateLessonStepikLessonIdSetNull(Long lessonId) {
        lessonRepository.updateStepikLessonId(lessonId);
        log.info("Updated lesson {} set NULL value", lessonId);
    }

    public void clearStepikLessonIdsBySectionId(Long sectionId) {
        log.info("Clearing stepikLessonId for all lessons in section {}", sectionId);
        int updatedCount = lessonRepository.clearStepikLessonIdsByModelId(sectionId);
        log.info("Cleared stepikLessonId for {} lessons in section {}", updatedCount, sectionId);
    }

    private LessonResponseDTO mapToResponseDTO(Lesson lesson) {
        return LessonResponseDTO.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .position(lesson.getPosition())
                .stepikLessonId(lesson.getStepikLessonId())
                .sectionId(lesson.getSection().getId())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
