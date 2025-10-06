package org.core.service.crud;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.CreateStepDTO;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikBlockResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    public StepResponseDTO createStep(CreateStepDTO createStepDTO){
        Lesson lesson = lessonRepository.findById(createStepDTO.getLessonId())
                .orElseThrow(() -> new LessonNotFoundException("Lesson not found"));

        Integer position = getNextPosition(lesson.getId());

        Step step = new Step();
        step.setLesson(lesson);
        step.setType(createStepDTO.getType());
        step.setContent(createStepDTO.getContent());
        step.setPosition(position);
        step.setCost(createStepDTO.getCost());
        step.setStepikStepId(createStepDTO.getStepikStepId());

        if (createStepDTO.getStepikBlock() != null) {
            try {
                step.setStepikBlockData(objectMapper.writeValueAsString(createStepDTO.getStepikBlock()));
            } catch (Exception e) {
                log.error("Error serializing stepik block data", e);
                throw new RuntimeException("Error serializing stepik block data", e);
            }
        }

        log.info("Step created with id: {} in lesson: {} at position {}", step.getId(), lesson.getId(), position);
        return mapToResponseDto(stepRepository.save(step));
    }

    public StepResponseDTO getStepById(Long stepId) {
        Step step = getStepByStepId(stepId);
        return mapToResponseDto(step);
    }

    public List<StepResponseDTO> getLessonStepsByLessonId(Long lessonId) {
        List<Step> steps = stepRepository.findByLessonIdOrderByPositionAsc(lessonId);
        return steps.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public StepResponseDTO updateStep(UpdateStepDTO updateDto) {
        Step step = getStepByStepId(updateDto.getStepId());
        if (updateDto.getType() != null) {
            step.setType(updateDto.getType());
        }
        if (updateDto.getContent() != null) {
            step.setContent(updateDto.getContent());
        }
        if (updateDto.getCost() != null) {
            step.setCost(updateDto.getCost());
        }
        if (updateDto.getStepikStepId() != null) {
            step.setStepikStepId(updateDto.getStepikStepId());
        }
        if (updateDto.getStepikBlock() != null) {
            try {
                step.setStepikBlockData(objectMapper.writeValueAsString(updateDto.getStepikBlock()));
            } catch (Exception e) {
                log.error("Error serializing stepik block data", e);
                throw new RuntimeException("Error serializing stepik block data", e);
            }
        }
        if (updateDto.getPosition() != null && !updateDto.getPosition().equals(step.getPosition())) {
            changeStepPosition(step, updateDto.getPosition());
        }
        log.info("Step updated with ID: {}", updateDto.getStepId());
        return mapToResponseDto(stepRepository.save(step));
    }

    public void deleteStep(Long stepId) {
        Step step = getStepByStepId(stepId);
        Long lessonId = step.getLesson().getId();
        Integer position = step.getPosition();

        stepRepository.delete(step);
        reorderStepsAfterDeletion(lessonId, position);

        log.info("Step deleted with ID: {} from lesson: {}", stepId, lessonId);
    }

    private Step getStepByStepId(Long stepId){
        return stepRepository.findById(stepId)
                .orElseThrow(() -> new StepNotFoundException("Step not found"));
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
        StepikBlockResponse stepikBlock = null;
        if (step.getStepikBlockData() != null) {
            try {
                stepikBlock = objectMapper.readValue(step.getStepikBlockData(), StepikBlockResponse.class);
            } catch (Exception e) {
                log.error("Error deserializing stepik block data", e);
            }
        }

        return StepResponseDTO.builder()
                .id(step.getId())
                .type(step.getType())
                .content(step.getContent())
                .position(step.getPosition())
                .cost(step.getCost())
                .stepikBlock(stepikBlock)
                .stepikStepId(step.getStepikStepId())
                .createdAt(step.getCreatedAt())
                .updatedAt(step.getUpdatedAt())
                .lessonId(step.getLesson().getId())
                .build();
    }
}