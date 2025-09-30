package org.core.service.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Model;
import org.core.dto.lesson.CreateLessonDTO;
import org.core.dto.lesson.LessonResponseDTO;
import org.core.dto.lesson.UpdateLessonDTO;
import org.core.exception.LessonNotFoundException;
import org.core.exception.ModelNotFoundException;
import org.core.repository.LessonRepository;
import org.core.repository.ModelRepository;
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
    private final ModelRepository modelRepository;

    public LessonResponseDTO createLesson(CreateLessonDTO createDTO) {
        Model model = modelRepository.findById(createDTO.getModelId())
            .orElseThrow(() -> new ModelNotFoundException("Model not found"));
        Integer position = createDTO.getPosition();
        if (position == null) {
            position = getNextPosition(model.getId());
        } else {
            shiftLessonsPositions(model.getId(), position);
        }

        Lesson lesson = new Lesson();
        lesson.setModel(model);
        lesson.setTitle(createDTO.getTitle());
        lesson.setPosition(position);

        log.info("Created new lesson with ID: {} in model: {}", lesson.getId(), model.getId());
        return mapToResponseDTO(lessonRepository.save(lesson));
    }

    public LessonResponseDTO getLessonByLessonID(Long lessonId) {
        Lesson lesson = findLessonById(lessonId);
        return mapToResponseDTO(lesson);
    }

    public List<LessonResponseDTO> getModelLessonsByModelId(Long modelId) {
        List<Lesson> lessons = lessonRepository.findByModelIdOrderByPositionAsc(modelId);
        return lessons.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public LessonResponseDTO updateLesson(UpdateLessonDTO updateDTO) {
        Lesson lesson = findLessonById(updateDTO.getLessonId());
        if (updateDTO.getTitle() != null) {
            lesson.setTitle(updateDTO.getTitle());
        }
        if (updateDTO.getDescription() != null) {
            lesson.setDescription(updateDTO.getDescription());
        }
        if (updateDTO.getPosition() != null && !updateDTO.getPosition().equals(lesson.getPosition())) {
            changeLessonPosition(lesson, updateDTO.getPosition());
        }

        log.info("Updated lesson with ID: {}", updateDTO.getLessonId());
        return mapToResponseDTO(lessonRepository.save(lesson));
    }

    public void deleteLesson(Long lessonId) {
        Lesson lesson = findLessonById(lessonId);
        Long modelId = lesson.getModel().getId();
        Integer position = lesson.getPosition();

        lessonRepository.delete(lesson);
        reorderLessonsAfterDeletion(modelId, position);
        
        log.info("Deleted lesson with ID: {} from model: {}", lessonId, modelId);
    }

    private Lesson findLessonById(Long lessonId) {
        return lessonRepository.findById(lessonId)
            .orElseThrow(() -> new LessonNotFoundException("Lesson not found"));
    }

    private Integer getNextPosition(Long modelId) {
        return lessonRepository.findMaxPositionByModelId(modelId)
            .map(pos -> pos + 1)
            .orElse(1);
    }

    private void shiftLessonsPositions(Long modelId, Integer fromPosition) {
        lessonRepository.incrementPositionsFromPosition(modelId, fromPosition);
    }

    private void changeLessonPosition(Lesson lesson, Integer newPosition) {
        Long modelId = lesson.getModel().getId();
        Integer oldPosition = lesson.getPosition();
        if (newPosition < oldPosition) {
            lessonRepository.incrementPositionsRange(modelId, newPosition, oldPosition - 1);
        } else {
            lessonRepository.decrementPositionsRange(modelId, oldPosition + 1, newPosition);
        }
        lesson.setPosition(newPosition);
    }

    private void reorderLessonsAfterDeletion(Long modelId, Integer deletedPosition) {
        lessonRepository.decrementPositionsFromPosition(modelId, deletedPosition);
    }

    public List<LessonResponseDTO> getUnsyncedLessonsByModelId(Long modelId) {
        List<Lesson> lessons = lessonRepository.findByModelIdAndStepikLessonIdIsNullOrderByPositionAsc(modelId);
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

    public void clearStepikLessonIdsByModelId(Long modelId) {
        log.info("Clearing stepikLessonId for all lessons in model {}", modelId);
        int updatedCount = lessonRepository.clearStepikLessonIdsByModelId(modelId);
        log.info("Cleared stepikLessonId for {} lessons in model {}", updatedCount, modelId);
    }

    private LessonResponseDTO mapToResponseDTO(Lesson lesson) {
        return LessonResponseDTO.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .position(lesson.getPosition())
                .stepikLessonId(lesson.getStepikLessonId())
                .modelId(lesson.getModel().getId())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }
}
