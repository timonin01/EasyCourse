package org.core.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.exception.LessonNotFoundException;
import org.core.exception.StepNotFoundException;
import org.core.repository.LessonRepository;
import org.core.repository.StepRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepService {

    private final StepRepository stepRepository;
    private final LessonRepository lessonRepository;

    public StepResponseDTO createStep(CreateStepDTO createStepDTO){
        Lesson lesson = lessonRepository.findById(createStepDTO.getLessonId())
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found"));

        Integer position = createStepDTO.getPosition();
        if (position == null) {
            position = getNextPosition(lesson.getId());
        } else {
            shiftStepsPositions(lesson.getId(), position);
        }

        Step step = new Step();
        step.setLesson(lesson);
        step.setType(createStepDTO.getType());
        step.setContent(createStepDTO.getContent());
        step.setPosition(position);
        Step savedStep = stepRepository.save(step);

        log.info("Step created with id: {} in lesson: {}", savedStep.getId(), lesson.getId());
        return mapToResponseDto(savedStep);
    }

    public StepResponseDTO getStepById(Long id) {
        Step step = stepRepository.findById(id)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));

        return mapToResponseDto(step);
    }

    public List<StepResponseDTO> getLessonSteps(Long lessonId) {
        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lessonId);
        return steps.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public StepResponseDTO updateStep(Long stepId, UpdateStepDTO updateDto) {
        Step step = stepRepository.findById(stepId)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));

        if (updateDto.getType() != null) {
            step.setType(updateDto.getType());
        }
        if (updateDto.getContent() != null) {
            step.setContent(updateDto.getContent());
        }
        if (updateDto.getPosition() != null && !updateDto.getPosition().equals(step.getPosition())) {
            changeStepPosition(step, updateDto.getPosition());
        }
        Step updatedStep = stepRepository.save(step);

        log.info("Step updated with ID: {}", stepId);
        return mapToResponseDto(updatedStep);
    }

    public void deleteStep(Long stepId) {
        Step step = stepRepository.findById(stepId)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));

        Long lessonId = step.getLesson().getId();
        Integer position = step.getPosition();

        stepRepository.delete(step);

        reorderStepsAfterDeletion(lessonId, position);

        log.info("Step deleted with ID: {} from lesson: {}", stepId, lessonId);
    }

    private Integer getNextPosition(Long lessonId) {
        Integer maxPosition = stepRepository.findMaxPositionByLessonId(lessonId);
        return maxPosition == null ? 1 : maxPosition + 1;
    }

    private void shiftStepsPositions(Long lessonId, Integer fromPosition) {
        stepRepository.incrementPositionsFrom(lessonId, fromPosition);
    }

    private void changeStepPosition(Step step, Integer newPosition) {
        Long lessonId = step.getLesson().getId();
        Integer oldPosition = step.getPosition();

        if (newPosition < oldPosition) {
            stepRepository.incrementPositionsFromTo(lessonId, newPosition, oldPosition - 1);
        } else if (newPosition > oldPosition) {
            stepRepository.decrementPositionsFromTo(lessonId, oldPosition + 1, newPosition);
        }
        step.setPosition(newPosition);
    }

    private void reorderStepsAfterDeletion(Long lessonId, Integer deletedPosition) {
        stepRepository.decrementPositionsFrom(lessonId, deletedPosition + 1);
    }

    private StepResponseDTO mapToResponseDto(Step step) {
        return StepResponseDTO.builder()
                .id(step.getId())
                .type(step.getType())
                .content(step.getContent())
                .position(step.getPosition())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .lessonId(step.getLesson().getId())
                .build();
    }

}
