package org.core.service.stepik.step;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.core.domain.Lesson;
import org.core.domain.Step;
import org.core.dto.step.StepResponseDTO;
import org.core.dto.step.UpdateStepDTO;
import org.core.dto.stepik.step.StepikStepSourceResponse;
import org.core.dto.stepik.step.StepikStepSourceResponseData;
import org.core.exception.StepikStepIntegrationException;
import org.core.repository.LessonRepository;
import org.core.service.crud.StepService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor(access = AccessLevel.PACKAGE)
public class StepikStepSyncService {

    private final UpdateStepikStepService updateStepikStepService;
    private final StepikStepService stepikStepService;
    private final StepService stepService;
    private final LessonRepository lessonRepository;

    public StepikStepSourceResponseData syncStepWithStepik(Long stepId) {
        log.info("Starting sync step ID: {} with Stepik", stepId);
        
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        Step step = mapToStep(stepDTO);

        StepikStepSourceResponse response = stepikStepService.createStep(step);
        StepikStepSourceResponseData stepData = response.getStepSource();
        
        if (stepData != null) {
            stepService.updateStep(createUpdateDTO(stepId, stepData.getId()));
            log.info("Step {} successfully synced with Stepik step ID: {}", stepId, stepData.getId());
        }
        return stepData;
    }

    public StepikStepSourceResponseData updateStepInStepik(Long stepId) {
        log.info("Starting manual update of step ID: {} in Stepik", stepId);
        
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        if (stepDTO.getStepikStepId() == null) {
            throw new IllegalStateException("Step is not synced with Stepik. Step ID: " + stepId);
        }
        Step step = mapToStep(stepDTO);
        log.info("Mapped step for Stepik update: LessonId={}, Type='{}', Position={}", 
                stepDTO.getLessonId(), step.getType(), step.getPosition());

        try {
            return updateStepikStepService.performStepikPositionShift(step, stepDTO.getLessonId());
        } catch (StepikStepIntegrationException e) {
            log.error("Error updating step in Stepik : {}", e.getMessage());
            throw new StepikStepIntegrationException("Failed to update step in Stepik: " + e.getMessage());
        }
    }

    public void deleteStepFromStepik(Long stepId) {
        log.info("Starting deletion of step ID: {} from Stepik", stepId);
        
        StepResponseDTO stepDTO = stepService.getStepById(stepId);
        log.info("Step data: ID={}, Type='{}', StepikStepId={}", 
                stepDTO.getId(), stepDTO.getType(), stepDTO.getStepikStepId());
        if (stepDTO.getStepikStepId() == null) {
            throw new IllegalStateException("Step is not synced with Stepik. Step ID: " + stepId);
        }
        stepikStepService.deleteStep(stepDTO.getStepikStepId());
        stepService.updateStep(createUpdateDTO(stepId, null));
        
        log.info("Step {} successfully deleted from Stepik with step ID: {}", stepId, stepDTO.getStepikStepId());
    }

    private Step mapToStep(StepResponseDTO stepDTO) {
        Step step = new Step();
        step.setId(stepDTO.getId());
        step.setType(stepDTO.getType());
        step.setContent(stepDTO.getContent());
        step.setPosition(stepDTO.getPosition());
        step.setCost(stepDTO.getCost());
        step.setStepikStepId(stepDTO.getStepikStepId());

        Optional<Lesson> lesson = lessonRepository.findById(stepDTO.getLessonId());
        if (lesson.isEmpty()) {
            throw new IllegalStateException("Lesson not found for step ID: " + stepDTO.getId());
        }
        step.setLesson(lesson.get());
        step.setStepikBlockData(stepDTO.getStepikBlockJson());

        return step;
    }

    public boolean stepExistsInStepik(Long stepikStepId) {
        return stepikStepService.stepExistsInStepik(stepikStepId);
    }
    
    private UpdateStepDTO createUpdateDTO(Long stepId, Long stepikStepId) {
        UpdateStepDTO updateDTO = new UpdateStepDTO();
        updateDTO.setStepId(stepId);
        updateDTO.setStepikStepId(stepikStepId);
        return updateDTO;
    }
}